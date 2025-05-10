import { authenticatedFetch } from '../js/utils/api.js';

class Header extends HTMLElement {
  constructor() {
    super();
    this.user = null;
  }

  async connectedCallback() {
    console.log('Header component connected');
    
    try {
      const { ok, data } = await authenticatedFetch('/api/user');
      if (ok) {
        this.user = data;
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      this.user = null;
    }
    
    this.render();
  }

  render() {
    console.log('Rendering header, user state:', this.user);
    this.innerHTML = `
      <nav>
        <div class="logo">
          <img src="/assets/images/logo2.png" alt="شعار الموقع" />
        </div>
        <ul class="nav-links">
          <li><a href="/">الرئيسية</a></li>
          <li><a href="#faq">أسئلة شائعة</a></li>
          <li><a href="#contact">الاتصال</a></li>
          <li>
            ${this.user ?
              `<div class="user-menu">
                <a href="/account" class="username-link">${this.user.username}</a>
                ${this.user.username === 'admin' ? 
                  `<a href="/templates/admin.html" class="admin-link" style="color: #a68bd8; margin: 0 10px;">لوحة التحكم</a>` : 
                  ''}
                <button class="logout-btn" onclick="this.closest('site-header').handleLogout()">تسجيل خروج</button>
               </div>` :
              `<a href="/auth/login.html">تسجيل الدخول</a>`
            }
          </li>
        </ul>
      </nav>
    `;
  }

  async handleLogout() {
    try {
      console.log('Logging out...');
      await authenticatedFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      // Always clear local state, even if server request fails
      localStorage.removeItem('token');
      this.user = null;
      this.render();
      console.log('Logout complete, redirecting...');
      window.location.href = '/';
    }
  }
}

customElements.define('site-header', Header);