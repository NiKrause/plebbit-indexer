export default function DarkModeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Initialize dark mode from localStorage immediately
            const darkMode = localStorage.getItem('darkMode');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            // Apply dark mode if explicitly enabled or if no preference and system prefers dark
            if (darkMode === 'enabled' || (darkMode === null && systemPrefersDark)) {
              document.documentElement.classList.add('dark');
            }
            
            // Function to toggle dark mode
            function toggleDarkMode() {
              const isDarkMode = document.documentElement.classList.toggle('dark');
              localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
              
              // Update all toggle button icons
              const updateIcon = (button) => {
                const svg = button.querySelector('svg path');
                if (svg) {
                  if (isDarkMode) {
                    // Moon icon for dark mode
                    svg.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
                  } else {
                    // Sun icon for light mode
                    svg.setAttribute('d', 'M12 3v1M12 20v1M4.22 4.22l.7.7M17.68 17.68l.7.7M1 12h1M20 12h1M4.22 19.78l.7-.7M17.68 6.32l.7-.7M12 7a5 5 0 000 10 5 5 0 000-10z');
                  }
                }
              };
              
              // Update desktop button
              const desktopButton = document.getElementById('dark-mode-toggle');
              if (desktopButton) updateIcon(desktopButton);
              
              // Update mobile button
              const mobileButton = document.getElementById('dark-mode-toggle-mobile');
              if (mobileButton) updateIcon(mobileButton);
            }
            
            // Make toggle function globally available
            window.toggleDarkMode = toggleDarkMode;
            
            // Add event listeners when DOM is ready
            function addEventListeners() {
              const desktopButton = document.getElementById('dark-mode-toggle');
              const mobileButton = document.getElementById('dark-mode-toggle-mobile');
              
              if (desktopButton && !desktopButton.hasAttribute('data-listener-added')) {
                desktopButton.addEventListener('click', toggleDarkMode);
                desktopButton.setAttribute('data-listener-added', 'true');
              }
              
              if (mobileButton && !mobileButton.hasAttribute('data-listener-added')) {
                mobileButton.addEventListener('click', toggleDarkMode);
                mobileButton.setAttribute('data-listener-added', 'true');
              }
            }
            
            // Try to add listeners immediately if DOM is ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', addEventListeners);
            } else {
              addEventListeners();
            }
            
            // Listen for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
              const darkMode = localStorage.getItem('darkMode');
              // Only auto-switch if user hasn't set a preference
              if (darkMode === null) {
                if (e.matches) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              }
            });
          })();
        `,
      }}
    />
  );
}
