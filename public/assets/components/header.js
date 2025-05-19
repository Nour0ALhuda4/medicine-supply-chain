import { authenticatedFetch } from "../js/utils/api.js";

class Header extends HTMLElement {
  constructor() {
    super();
    this.user = null;
    this.menuActive = false;
    this.isMobile = window.innerWidth <= 768; // Initial mobile state
  }

  async connectedCallback() {
    console.log("Header component connected");
    this.isMobile = true; // Hardcode for testing to force mobile mode
    console.log("Forced mobile view for testing:", this.isMobile);
    console.log("Initial window.innerWidth:", window.innerWidth);

    // Listen for window resize to update mobile state
    window.addEventListener('resize', this.handleResize.bind(this));

    try {
      const { ok, data } = await authenticatedFetch("/api/user");
      if (ok) {
        this.user = data;
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      this.user = null;
    }

    // Initial render
    this.render();
    this.setupEventListeners();

    // Force re-render after a short delay to catch late viewport changes
    setTimeout(() => {
      this.isMobile = window.innerWidth <= 768;
      console.log("Delayed window.innerWidth:", window.innerWidth);
      console.log("Is mobile view (delayed):", this.isMobile);
      this.render();
      this.setupEventListeners();
    }, 100);
  }

  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;

    console.log("Resize event - window.innerWidth:", window.innerWidth);
    console.log("Is mobile view (resize):", this.isMobile);

    if (wasMobile !== this.isMobile) {
      console.log("Mobile state changed:", this.isMobile);
      this.render();
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    const menuToggle = this.querySelector("#menuToggle");
    const navLinks = this.querySelector(".nav-links");

    console.log("Setup event listeners, menuToggle exists:", !!menuToggle);

    if (menuToggle && navLinks) {
      menuToggle.removeEventListener('click', this._toggleHandler);

      this._toggleHandler = () => {
        console.log("Menu toggle clicked");
        this.menuActive = !this.menuActive;
        navLinks.classList.toggle("active", this.menuActive);
        document.body.style.overflow = this.menuActive ? "hidden" : "";
      };

      menuToggle.addEventListener("click", this._toggleHandler);
    }

    const links = this.querySelectorAll(".nav-links a");
    links.forEach((link) => {
      link.addEventListener("click", () => {
        if (this.menuActive && navLinks) {
          this.menuActive = false;
          navLinks.classList.remove("active");
          document.body.style.overflow = "";
        }
      });
    });
  }

  render() {
    console.log("Rendering header, user state:", this.user);
    console.log("Current mobile state:", this.isMobile);

    this.innerHTML = `
      <nav>
        <div class="logo">
          <img src="/assets/images/logo2.png" alt="شعار الموقع" />
        </div>
        ${this.isMobile ? `
          <button 
            class="menu-toggle" 
            id="menuToggle" 
            aria-label="القائمة">
            ☰
          </button>
        ` : ''}
        <ul class="nav-links ${this.menuActive ? 'active' : ''}">
          <li><a href="/">الرئيسية</a></li>
          <li><a href="#faq">أسئلة شائعة</a></li>
          <li><a href="#contact">الاتصال</a></li>
          <li>
            ${
        this.user
            ? `<div class="user-menu">
                <a href="/account" class="username-link">${
                this.user.username
            }</a>
                ${
                this.user.username === "admin"
                    ? `<a href="/templates/admin.html" class="admin-link" style="color: #a68bd8; margin: 0 10px;">لوحة التحكم</a>`
                    : ""
            }
                <button class="logout-btn" onclick="this.closest('site-header').handleLogout()">تسجيل خروج</button>
               </div>`
            : `<a href="/auth/login.html">تسجيل الدخول</a>`
    }
          </li>
        </ul>
      </nav>
    `;

    const menuBtn = this.querySelector("#menuToggle");
    console.log("After render, menu button exists:", !!menuBtn);
    if (menuBtn) {
      const computedStyle = window.getComputedStyle(menuBtn);
      console.log("Button display style:", computedStyle.display);
      console.log("Button visibility:", computedStyle.visibility);
      console.log("Button position:", computedStyle.position);
      console.log("Button top/left:", computedStyle.top, computedStyle.left);
      console.log("Button z-index:", computedStyle.zIndex);
      console.log("Button HTML:", menuBtn.outerHTML);
    }
  }

  async handleLogout() {
    try {
      console.log("Logging out...");
      await authenticatedFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      localStorage.removeItem("token");
      this.user = null;
      this.render();
      this.setupEventListeners();
      console.log("Logout complete, redirecting...");
      window.location.href = "/";
    }
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize.bind(this));
  }
}

customElements.define("site-header", Header);