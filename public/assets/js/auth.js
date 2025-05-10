import { authenticatedFetch } from './utils/api.js';

export async function register(event) {
  event.preventDefault();

  const form = event.target;
  const username = form.username.value;
  const phoneNumber = form.phoneNumber.value;
  const password = form.password.value;

  try {
    const { ok, text, data } = await authenticatedFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: username,
        phone_number: phoneNumber,
        password: password,
      }),
    });

    if (ok) {
      alert('Registration successful! Please log in.');
      window.location.href = '/login';
    } else {
      alert(text || 'Registration failed. Please try again.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Registration failed: ' + error.message);
  }
}

export async function login(event) {
  event.preventDefault();

  const form = event.target;
  const username = form.username.value;
  const password = form.password.value;

  try {
    console.log('Attempting login for user:', username);
    const { ok, data, text } = await authenticatedFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });
    
    if (ok && data.token) {
      localStorage.setItem('token', data.token);
      console.log('Token stored in localStorage');
      window.location.href = '/';
    } else {
      const errorMessage = text || 'Login failed. Please try again.';
      console.error('Login failed:', errorMessage);
      alert(errorMessage);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Login failed: ' + error.message);
  }
}