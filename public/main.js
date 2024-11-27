document.addEventListener('DOMContentLoaded', () => {
   const loginForm = document.getElementById('loginForm');
   const registerForm = document.getElementById('registerForm');
 
   // Login Form Handler
   if (loginForm) {
     loginForm.addEventListener('submit', async (e) => {
       e.preventDefault();
       const email = document.getElementById('email').value;
       const password = document.getElementById('password').value;
 
       try {
         const response = await fetch('https://expense-manger-d8ks.onrender.com/api/login', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({ email, password })
         });
 
         const data = await response.json();
 
         if (response.ok) {
           // Save token and user info to localStorage
           localStorage.setItem('token', data.token);
           localStorage.setItem('userId', data.userId);
           localStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
           
           // Redirect to dashboard or home page
           window.location.href = 'https://expense-manger-d8ks.onrender.com/dashboard.html';
         } else {
           alert(data.message || 'Login failed');
         }
       } catch (error) {
         console.error('Login error:', error);
         alert('An error occurred during login');
       }
     });
   }
 
   // Register Form Handler
   if (registerForm) {
     registerForm.addEventListener('submit', async (e) => {
       e.preventDefault();
       const firstName = document.getElementById('firstName').value;
       const lastName = document.getElementById('lastName').value;
       const email = document.getElementById('emailCreate').value;
       const password = document.getElementById('passwordCreate').value;
 
       try {
        const response = await fetch('https://expense-manger-d8ks.onrender.com/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            firstName, 
            lastName, 
            email, 
            password 
          })
        });
 
         const data = await response.json();
 
         if (response.ok) {
           alert('Registration successful! Please log in.');
           // Optionally switch to login form
           document.getElementById('loginButtonAccess').click();
         } else {
           alert(data.message || 'Registration failed');
         }
       } catch (error) {
         console.error('Registration error:', error);
         alert('An error occurred during registration');
       }
     });
   }
 
   // Existing password toggle functionality
   const passwordToggles = (loginPass, loginEye) => {
     const input = document.getElementById(loginPass);
     const iconEye = document.getElementById(loginEye);
 
     iconEye.addEventListener('click', () => {
       input.type = input.type === 'password' ? 'text' : 'password';
       iconEye.classList.toggle('ri-eye-fill');
       iconEye.classList.toggle('ri-eye-off-fill');
     });
   }
 
   passwordToggles('password', 'loginPassword');
   passwordToggles('passwordCreate', 'loginPasswordCreate');
 
   // Show/Hide Login & Create Account
   const loginAcessRegister = document.getElementById('loginAccessRegister');
   const buttonRegister = document.getElementById('loginButtonRegister');
   const buttonAccess = document.getElementById('loginButtonAccess');
 
   buttonRegister.addEventListener('click', () => {
     loginAcessRegister.classList.add('active');
   });
 
   buttonAccess.addEventListener('click', () => {
     loginAcessRegister.classList.remove('active');
   });
 });
