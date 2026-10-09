const fs = require('fs');

function processFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Replace dark: classes
  content = content.replace(/dark:[^\s"'>]+/g, '');

  // Replace indigo/purple to blue/cyan
  content = content.replace(/indigo/g, 'cyan');
  content = content.replace(/purple/g, 'blue');

  // Hero section enhancements
  content = content.replace(/text-gradient/g, 'text-gradient text-glow-cyan');
  
  // Empty state bounce
  content = content.replace(/animate-fade-in"/g, 'animate-scale-in"');
  content = content.replace(/animate-fade-in-up/g, 'animate-card-enter');
  content = content.replace(/animate-fade-in /g, 'animate-scale-in ');
  
  // glass-card enhancements
  // Using a regex with lookahead/lookbehind is tricky, we can just replace 'glass-card '
  content = content.replace(/glass-card /g, 'glass-card hover:animate-border-glow ');
  
  // Icon containers
  content = content.replace(/w-12 h-12 rounded-xl /g, 'w-12 h-12 rounded-xl icon-3d animate-float ');
  content = content.replace(/w-16 h-16 rounded-2xl /g, 'w-16 h-16 rounded-2xl icon-3d animate-bounce-soft ');
  content = content.replace(/w-13 h-13 rounded-2xl /g, 'w-13 h-13 rounded-2xl icon-3d animate-float ');
  
  // Badges pulsing
  content = content.replace(/badge-pending/g, 'badge-pending animate-pulse-glow');
  content = content.replace(/badge-active/g, 'badge-active animate-pulse-glow');
  content = content.replace(/badge-overdue/g, 'badge-overdue animate-pulse-glow');
  
  // Buttons
  content = content.replace(/btn-primary/g, 'btn-primary hover:animate-border-glow');

  // animate-rotate-in somewhere like a loader or icon
  content = content.replace(/animate-spin/g, 'animate-rotate-in');

  fs.writeFileSync(path, content, 'utf8');
}

['MyBorrows.jsx', 'BorrowRequests.jsx', 'MoneyLoans.jsx', 'Fines.jsx'].forEach(file => {
  const fullPath = 'C:/Users/Sai_0/Documents/BorrowBack/client/src/pages/' + file;
  if (fs.existsSync(fullPath)) {
    processFile(fullPath);
    console.log('Processed', file);
  } else {
    console.log('File not found:', fullPath);
  }
});
