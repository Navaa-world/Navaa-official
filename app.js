      /*=========================================================
                          JAVASCRIPT START
      ==========================================================*/
      
      /*========================================
                  NAVAA THEME SYSTEM
      ========================================*/

      const themeToggle = document.getElementById("themeToggle");
      function setTheme(theme) {
        document.documentElement.setAttribute(
          "data-theme",
          theme
        );

        localStorage.setItem("navaa-theme", theme);

        if (themeToggle) {
          themeToggle.textContent =
            theme === "dark" ? "☀" : "☾";
        }
      }
      
      /**************************************
                  Load saved theme
      **************************************/

      const savedTheme =
        localStorage.getItem("navaa-theme") || "dark";
      setTheme(savedTheme);

    /**************************************
                  Toggle theme
    **************************************/

      themeToggle.addEventListener("click", () => {

        const currentTheme =
          document.documentElement.getAttribute("data-theme");
        setTheme(
          currentTheme === "dark" ? "light" : "dark"
        );
      });
      
    

      (() => {
        'use strict';
        const TOKEN_ADDRESS =
          '0x82dba663278ADF0c398c1795a31760c7a76CA932';

        const POLYGON_CHAIN_ID = 137n;
        const TOKEN_ABI = [
          'function balanceOf(address) view returns (uint256)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)'
        ];

        const $ = id => document.getElementById(id);
        const appPages = document.querySelectorAll('.app-page');
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
        const connectBtn = $('connectBtn');
        const balanceAmount = $('navaaBalanceAmount');
        const balanceStatus = $('navaaBalanceStatus');
        const balanceVisibilityBtn = $('balanceVisibilityBtn');
       
        let balanceHidden = false;
        let actualBalanceText = '—';
        
        const eyeOpenIcon = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/>
        <circle cx="12" cy="12" r="3"/>
        </svg>`;
        
        const eyeClosedIcon = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m3 3 18 18"/>
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
        <path d="M9.9 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7a14 14 0 0 1-3 3.8"/>
        <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 3-.5"/>
        </svg>`;

        let walletAddress = null;

        function shortAddress(address) {
          return address.slice(0, 6) + '...' + address.slice(-4);
        }
        
        function showBalance(value) {
          actualBalanceText = value;
          balanceAmount.textContent = balanceHidden
            ? '••••••••'
            : actualBalanceText;
        }

        balanceVisibilityBtn.addEventListener('click', () => {
          balanceHidden = !balanceHidden;
            showBalance(actualBalanceText);

          balanceVisibilityBtn.innerHTML = balanceHidden
            ? eyeClosedIcon
            : eyeOpenIcon;
          
          balanceVisibilityBtn.setAttribute(
            'aria-label',
            balanceHidden ? 'Show balance' : 'Hide balance'
          );

          balanceVisibilityBtn.title =
            balanceHidden ? 'Show balance' : 'Hide balance';
        });
 
        function showStatus(message) {
          balanceStatus.textContent = message;
        }
        
        async function readNavaaBalance() {
          if (!walletAddress || !window.ethereum) return;
          try {
            const walletProvider =
              new ethers.BrowserProvider(window.ethereum);
            const network = await walletProvider.getNetwork();

            if (network.chainId !== POLYGON_CHAIN_ID) {
              showBalance('—');
              showStatus('Please switch to Polygon Mainnet');
              return;
            }

            const token = new ethers.Contract(
              TOKEN_ADDRESS,
              TOKEN_ABI,
              walletProvider
            );

            const [rawBalance, decimals, symbol] =
              await Promise.all([
                token.balanceOf(walletAddress),
                token.decimals(),
                token.symbol()
              ]);

            const formatted = Number(
              ethers.formatUnits(rawBalance, decimals)
            ).toLocaleString('en-US', {
              maximumFractionDigits: 4
            });
     
            showBalance(formatted);
            showStatus(
              shortAddress(walletAddress) +
              ' · ' + symbol + ' balance on Polygon'
            );
          } 
          
          catch (error) {
            console.error('NAVAA balance error:', error);
            showBalance('—');
            showStatus('Unable to load NAVAA balance. Please retry.');
          }
        }

        async function connectWallet() {
          try {
            if (!window.ethereum) {
              showStatus('Open this website inside MetaMask, Trust Wallet or SafePal DApp browser.');
              return;
            }

            connectBtn.disabled = true;
            connectBtn.textContent = 'Connecting...';

            let accounts = await window.ethereum.request({
              method: 'eth_requestAccounts'
            });

            if (!accounts || !accounts.length) {
              throw new Error('No wallet account found.');
            }

            let chain = await window.ethereum.request({
              method: 'eth_chainId'
            });

            if (BigInt(chain) !== POLYGON_CHAIN_ID) {
              try {
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0x89' }]
                });
              } catch (error) {
                if (error.code === 4902) {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                      chainId: '0x89',
                      chainName: 'Polygon Mainnet',
                      nativeCurrency: {
                        name: 'POL',
                        symbol: 'POL',
                        decimals: 18
                      },
                      rpcUrls: ['https://polygon.drpc.org'],
                      blockExplorerUrls: ['https://polygonscan.com']
                    }]
                  });
                }
                else {
                  throw error;
                }
              }
            }

            accounts = await window.ethereum.request({
              method: 'eth_accounts'
            });
            
            walletAddress = accounts[0];
            connectBtn.textContent = shortAddress(walletAddress);
            await readNavaaBalance();
          }
          
          catch (error) {
            console.error('Wallet connection error:', error);
            showStatus(error.message || 'Wallet connection failed.');
            connectBtn.textContent = 'Connect wallet';
          }
          
          finally {
            connectBtn.disabled = false;
          }
        }
        
        connectBtn.addEventListener('click', connectWallet);
        if (window.ethereum && window.ethereum.on) {
          window.ethereum.on('accountsChanged', accounts => {
            walletAddress = accounts.length ? accounts[0] : null;
            if (!walletAddress) {
              connectBtn.textContent = 'Connect wallet';
              showBalance('—');
              showStatus('Connect wallet to view your balance');
              return;
            }

            connectBtn.textContent = shortAddress(walletAddress);
            readNavaaBalance();
          });

          window.ethereum.on('chainChanged', () => {
            readNavaaBalance();
        });
      }
 
        // Restore an already-authorized wallet without a new permission prompt
        
        async function restoreWallet() {
          if (!window.ethereum) return;
          try {
            const accounts = await window.ethereum.request({
              method: 'eth_accounts'
            });
            if (accounts.length) {
              walletAddress = accounts[0];
              connectBtn.textContent = shortAddress(walletAddress);
              await readNavaaBalance();
            }
          } 
          
          catch (error) {
            console.error(error);
          }
        }

        restoreWallet();
        
         /* =================================
             NAVAA PAGE NAVIGATION SYSTEM
        ==================================== */

        function showPage(pageName) {
          const validPages = [
            'home',
            'dashboard',
            'earn',
            'refer',
            'exchange'
          ];

          if (!validPages.includes(pageName)) return;
            appPages.forEach(page => {
            page.classList.remove('active');
          });
          
          const targetPage = document.getElementById(
            'page' + pageName.charAt(0).toUpperCase() + pageName.slice(1)
          );

          if (targetPage) {
            targetPage.classList.add('active');
          }

            bottomNavItems.forEach(button => {
            const isActive = button.dataset.pageTarget === pageName;
            button.classList.toggle('active', isActive);

            if (isActive) {
              button.setAttribute('aria-current', 'page');
            } else {
              button.removeAttribute('aria-current');
            }
          });

          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
        
        /*========== Bottom navigation clicks ==============*/
          bottomNavItems.forEach(button => {
          button.addEventListener('click', () => {
            showPage(button.dataset.pageTarget);
          });
        });
        
        /*=========== Logo always opens Home ==============*/
        document.getElementById('homeLogoBtn').addEventListener('click', () => {
          showPage('home');
        });


        /*================================
                  Add Fund popup
        ================================*/
        $('addFundBtn').addEventListener('click', () => {
          $('fundSheet').classList.add('show');
        });

        $('closeFundSheet').addEventListener('click', () => {
          $('fundSheet').classList.remove('show');
        });

        $('fundSheet').addEventListener('click', event => {
          if (event.target === $('fundSheet')) {
            $('fundSheet').classList.remove('show');
          }
        });

        $('fundP2P').addEventListener('click', () => {
          $('fundMessage').textContent = 'P2P is coming soon.';
        });

        $('fundExchange').addEventListener('click', () => {
          $('fundSheet').classList.remove('show');
          showPage('exchange');
        });  
      })();
