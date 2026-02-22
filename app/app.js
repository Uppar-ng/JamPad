const app = {
    // State
    properties: [],
    schools: [],
    favorites: [],
    banners: [],
    user: null,
    filters: {
        category: 'all',
        university: null,
        propertyType: null,
        maxPrice: null,
        bedrooms: 'any'
    },
    currentPage: 'home',
    searchQuery: '',
    searchTimeout: null,
    currentProperty: null,
    universities: [],
    isDesktop: window.innerWidth > 768,
    currentBannerIndex: 0,
    bannerInterval: null,
    scrollTimeout: null,
    
    // State for animated FAB
    fabMenuOpen: false,

    async init() {
        try {
            this.loadUserData();
            this.loadFavorites();
            this.applyTheme();
            await this.loadData();
            const hash = window.location.hash.replace('#', '') || 'home';
            this.currentPage = hash;
            this.render();
            this.setupEventListeners();
            this.updateFABBadge();
            this.startBannerRotation();
            setTimeout(() => this.hideLoading(), 800);
        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('Failed to initialize app', 'error');
            setTimeout(() => this.hideLoading(), 800);
        }
    },

    toggleFabMenu() {
        this.fabMenuOpen = !this.fabMenuOpen;
        const fabMain = document.getElementById('fabMain');
        const fabMenu = document.getElementById('fabMenu');
        
        if (fabMain && fabMenu) {
            if (this.fabMenuOpen) {
                fabMain.classList.add('active');
                fabMenu.classList.add('active');
            } else {
                fabMain.classList.remove('active');
                fabMenu.classList.remove('active');
            }
        }
    },

    loadUserData() {
        try {
            const savedUser = localStorage.getItem('primer_user');
            if (savedUser) {
                this.user = JSON.parse(savedUser);
            } else {
                this.user = {
                    name: 'Guest User',
                    email: 'guest@primer.com',
                    phone: '+234 800 000 0000',
                    avatar: null,
                    address: '',
                    notifications: 'enabled',
                    preferences: {
                        darkMode: localStorage.getItem('primer_theme') === 'dark'
                    }
                };
                this.saveUserData();
            }
        } catch (error) {
            console.warn('Failed to load user data:', error);
            this.user = this.getDefaultUser();
        }
    },

    getDefaultUser() {
        return {
            name: 'Guest User',
            email: 'guest@primer.com',
            phone: '+234 800 000 0000',
            avatar: null,
            address: '',
            notifications: 'enabled',
            preferences: {
                darkMode: localStorage.getItem('primer_theme') === 'dark'
            }
        };
    },

    loadFavorites() {
        try {
            const saved = localStorage.getItem('primer_favorites');
            this.favorites = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Failed to load favorites:', error);
            this.favorites = [];
        }
    },

    saveUserData() {
        try {
            localStorage.setItem('primer_user', JSON.stringify(this.user));
        } catch (error) {
            console.warn('Failed to save user data:', error);
        }
    },

    async loadData() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const propertiesResponse = await fetch('https://raw.githubusercontent.com/Uppar-ng/Uppar-ng/main/properties.json', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!propertiesResponse.ok) {
                throw new Error(`HTTP error! status: ${propertiesResponse.status}`);
            }
            
            const propertiesData = await propertiesResponse.json();
            this.properties = propertiesData.properties || [];
            this.schools = propertiesData.schools || [];
            
            if (this.properties.length === 0) {
                this.properties = this.getDefaultProperties();
            }
            
            try {
                const dynamicResponse = await fetch('https://raw.githubusercontent.com/Uppar-ng/Uppar-ng/main/dynamic.json');
                if (dynamicResponse.ok) {
                    const dynamicData = await dynamicResponse.json();
                    this.banners = dynamicData.banners || [];
                }
            } catch (bannerError) {
                console.warn('Failed to load banners:', bannerError);
            }
            
            if (this.banners.length === 0) {
                this.banners = this.getDefaultBanners();
            }
            
            this.extractUniversities();
            
        } catch (error) {
            console.error('Failed to load data:', error);
            this.properties = this.getDefaultProperties();
            this.banners = this.getDefaultBanners();
            this.extractUniversities();
            this.showToast('Using offline data', 'info');
        }
    },

    getDefaultProperties() {
        return [
            {
                id: 'prop1',
                title: 'Modern Studio Apartment',
                price: 85000,
                location: 'Ikeja, Lagos',
                school: 'University of Lagos',
                category: 'regular',
                propertyType: 'studio',
                images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'],
                bedrooms: 1,
                bathrooms: 1,
                features: ['WiFi', 'AC', 'Furnished'],
                landlord: { name: 'John Doe', rating: 4.8, phone: '+234 801 234 5678' },
                distance: '15 min walk',
                isNew: true
            },
            {
                id: 'prop2',
                title: 'Student Hostel - Male Only',
                price: 45000,
                location: 'Akoka, Lagos',
                school: 'University of Lagos',
                category: 'student',
                propertyType: 'hostel',
                images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600'],
                bedrooms: 2,
                bathrooms: 2,
                features: ['Study Room', 'Cafeteria', '24/7 Security'],
                landlord: { name: 'Jane Smith', rating: 4.5, phone: '+234 802 345 6789' },
                distance: '5 min walk',
                isPopular: true
            },
            {
                id: 'prop3',
                title: '2-Bedroom Flat',
                price: 120000,
                location: 'Yaba, Lagos',
                school: 'University of Lagos',
                category: 'regular',
                propertyType: 'flat',
                images: ['https://images.unsplash.com/photo-1560448204-7e9d0e5c5c5c?w=600'],
                bedrooms: 2,
                bathrooms: 2,
                features: ['Parking', 'Generator', 'Water'],
                landlord: { name: 'Mike Johnson', rating: 4.7, phone: '+234 803 456 7890' },
                distance: '10 min drive'
            },
            {
                id: 'prop4',
                title: 'Self-Contained Studio',
                price: 65000,
                location: 'Surulere, Lagos',
                school: 'University of Lagos',
                category: 'regular',
                propertyType: 'studio',
                images: ['https://images.unsplash.com/photo-1560448204-5e4c7e9d2f4e?w=600'],
                bedrooms: 1,
                bathrooms: 1,
                features: ['Tiled Floor', 'Kitchen', 'Bathroom'],
                landlord: { name: 'Sarah Williams', rating: 4.6, phone: '+234 804 567 8901' },
                distance: '20 min walk'
            }
        ];
    },

    getDefaultBanners() {
        return [
            {
                id: 1,
                icon: 'fa-home',
                title: 'Find Your Perfect Home',
                description: 'Browse apartments, houses, and accommodations near you',
                buttonText: 'Explore Now',
                buttonLink: '#explore'
            },
            {
                id: 2,
                icon: 'fa-bolt',
                title: '24/7 Electricity',
                description: 'Properties with guaranteed power supply',
                buttonText: 'View Listings',
                buttonLink: '#explore'
            },
            {
                id: 3,
                icon: 'fa-wifi',
                title: 'High-Speed Internet',
                description: 'Stay connected with fiber optic WiFi',
                buttonText: 'Browse',
                buttonLink: '#explore'
            }
        ];
    },

    extractUniversities() {
        const uniMap = new Map();
        this.properties.forEach(p => {
            if (p.school) {
                uniMap.set(p.school, (uniMap.get(p.school) || 0) + 1);
            }
        });
        
        this.universities = Array.from(uniMap.entries()).map(([name, count]) => ({
            name,
            count
        })).sort((a, b) => b.count - a.count);
    },

    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    },

    startBannerRotation() {
        if (this.bannerInterval) clearInterval(this.bannerInterval);
        if (this.banners.length <= 1) return;
        
        this.bannerInterval = setInterval(() => {
            this.currentBannerIndex = (this.currentBannerIndex + 1) % this.banners.length;
            this.updateBanner();
        }, 5000);
    },

    updateBanner() {
        const bannerContainer = document.getElementById('dynamicBanner');
        if (!bannerContainer) return;
        
        const banner = this.banners[this.currentBannerIndex];
        if (!banner) return;
        
        const safeTitle = this.escapeHtml(banner.title || '');
        const safeDescription = this.escapeHtml(banner.description || '');
        const safeButtonText = this.escapeHtml(banner.buttonText || 'Learn More');
        const icon = this.escapeHtml(banner.icon || 'fa-home');
        
        bannerContainer.innerHTML = `
            <div class="banner-content">
                <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                    <div class="banner-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="banner-text">
                        <h3 class="banner-title">${safeTitle}</h3>
                        <p class="banner-description">${safeDescription}</p>
                    </div>
                </div>
                <a href="${banner.buttonLink || '#explore'}" class="banner-btn" onclick="app.navigate('explore'); event.preventDefault();">
                    ${safeButtonText} <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
    },

    escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    render() {
        const container = document.getElementById('app');
        this.isDesktop = window.innerWidth > 768;
        
        try {
            switch(this.currentPage) {
                case 'home':
                    container.innerHTML = this.renderHome();
                    break;
                case 'explore':
                    container.innerHTML = this.renderExplore();
                    break;
                case 'favorites':
                    container.innerHTML = this.renderFavorites();
                    break;
                case 'profile':
                    container.innerHTML = this.renderProfile();
                    break;
                default:
                    container.innerHTML = this.renderHome();
            }
            
            this.updateFABBadge();
            this.checkScroll();
        } catch (error) {
            console.error('Render error:', error);
            container.innerHTML = '<div style="padding: 50px; text-align: center;">Error loading page. Please refresh.</div>';
        }
    },

    checkScroll() {
        const fab = document.getElementById('fabScrollTop');
        if (!fab) return;
        
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 300) {
            fab.style.display = 'flex';
        } else {
            fab.style.display = 'none';
        }
    },

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    },

    renderHome() {
        const featured = this.properties.slice(0, 4);
        const studentProps = this.properties.filter(p => p.category === 'student').slice(0, 4);
        const regularProps = this.properties.filter(p => p.category === 'regular').slice(0, 4);
        const currentBanner = this.banners[this.currentBannerIndex] || this.banners[0];
        
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="logo">
                        <div class="logo-image">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232563EB' rx='20'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'%3EP%3C/text%3E%3C/svg%3E" alt="Primer">
                        </div>
                        <span class="logo-text">Primer</span>
                    </div>
                    <div class="header-actions">
                        <a href="services.html" class="btn btn-service" onclick="event.preventDefault(); window.location.href='services.html';">
                            <i class="fas fa-bolt"></i>
                            <span class="desktop-only">Services</span>
                        </a>
                        <a href="app.html" class="btn btn-primary" onclick="event.preventDefault(); window.location.href='app.html';">
                            <i class="fas fa-mobile-alt"></i>
                            <span class="desktop-only">Get App</span>
                        </a>
                        <button class="icon-btn" onclick="app.toggleTheme()">
                            <i class="fas ${this.user.preferences.darkMode ? 'fa-sun' : 'fa-moon'}"></i>
                        </button>
                    </div>
                </div>
            </header>

            <div class="search-section">
                <div class="search-container">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        class="search-input" 
                        placeholder="Search by location or university..."
                        value="${this.escapeHtml(this.searchQuery)}"
                        oninput="app.handleSearchInput(this.value)"
                    >
                </div>
            </div>

            <div class="banner-ad" id="dynamicBanner">
                <div class="banner-content">
                    <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                        <div class="banner-icon">
                            <i class="fas ${this.escapeHtml(currentBanner?.icon || 'fa-home')}"></i>
                        </div>
                        <div class="banner-text">
                            <h3 class="banner-title">${this.escapeHtml(currentBanner?.title || 'Find Your Perfect Home')}</h3>
                            <p class="banner-description">${this.escapeHtml(currentBanner?.description || 'Browse apartments, houses, and accommodations')}</p>
                        </div>
                    </div>
                    <a href="${currentBanner?.buttonLink || '#explore'}" class="banner-btn" onclick="app.navigate('explore'); event.preventDefault();">
                        ${this.escapeHtml(currentBanner?.buttonText || 'Learn More')} <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>

            <div class="filters-wrapper">
                <div class="filter-pills">
                    <div class="filter-pill ${!this.filters.university ? 'active' : ''}" onclick="app.filterByUniversity(null)">
                        <i class="fas fa-university"></i> All
                        <span class="count">${this.properties.length}</span>
                    </div>
                    ${this.universities.slice(0, 8).map(uni => `
                        <div class="filter-pill ${this.filters.university === uni.name ? 'active' : ''}" onclick="app.filterByUniversity('${this.escapeHtml(uni.name).replace(/'/g, "\\'")}')">
                            ${this.escapeHtml(uni.name.split(' ').slice(0, 2).join(' '))}
                            <span class="count">${uni.count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section-header">
                <h2>Featured Properties</h2>
                <a href="#explore" onclick="app.navigate('explore'); event.preventDefault();">View All</a>
            </div>
            
            <div class="property-grid">
                ${this.renderPropertyCards(featured)}
            </div>

            <div class="section-header" style="margin-top: 16px;">
                <h2>Student Accommodations</h2>
                <a href="#explore" onclick="app.filterByCategory('student'); app.navigate('explore'); event.preventDefault();">View All</a>
            </div>
            
            <div class="property-grid">
                ${this.renderPropertyCards(studentProps)}
            </div>

            <div class="section-header" style="margin-top: 16px;">
                <h2>Regular Listings</h2>
                <a href="#explore" onclick="app.filterByCategory('regular'); app.navigate('explore'); event.preventDefault();">View All</a>
            </div>
            
            <div class="property-grid" style="margin-bottom: 20px;">
                ${this.renderPropertyCards(regularProps)}
            </div>
        `;
    },

    renderExplore() {
        const filteredProps = this.filterProperties();
        
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="logo">
                        <div class="logo-image">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232563EB' rx='20'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'%3EP%3C/text%3E%3C/svg%3E" alt="Primer">
                        </div>
                        <span class="logo-text">Explore</span>
                    </div>
                    <div class="header-actions">
                        <button class="icon-btn ${this.filters.category === 'student' ? 'active' : ''}" onclick="app.filterByCategory('student')">
                            <i class="fas fa-graduation-cap"></i>
                        </button>
                        <button class="icon-btn ${this.filters.category === 'regular' ? 'active' : ''}" onclick="app.filterByCategory('regular')">
                            <i class="fas fa-briefcase"></i>
                        </button>
                        <button class="icon-btn" onclick="app.showFilters()">
                            <i class="fas fa-sliders-h"></i>
                        </button>
                        <button class="icon-btn" onclick="app.toggleTheme()">
                            <i class="fas ${this.user.preferences.darkMode ? 'fa-sun' : 'fa-moon'}"></i>
                        </button>
                    </div>
                </div>
            </header>

            <div class="search-section">
                <div class="search-container">
                    <i class="fas fa-search"></i>
                    <input 
                        type="text" 
                        class="search-input" 
                        placeholder="Search by location, university, or property type..."
                        value="${this.escapeHtml(this.searchQuery)}"
                        oninput="app.handleSearchInput(this.value)"
                    >
                </div>
            </div>

            <div class="category-tabs">
                <button class="category-tab ${this.filters.category === 'all' ? 'active' : ''}" onclick="app.filterByCategory('all')">
                    <i class="fas fa-home"></i> All
                </button>
                <button class="category-tab ${this.filters.category === 'student' ? 'active' : ''}" onclick="app.filterByCategory('student')">
                    <i class="fas fa-graduation-cap"></i> Student
                </button>
                <button class="category-tab ${this.filters.category === 'regular' ? 'active' : ''}" onclick="app.filterByCategory('regular')">
                    <i class="fas fa-briefcase"></i> Regular
                </button>
            </div>

            <div class="filters-wrapper">
                <div class="filter-pills">
                    <button class="filter-pill ${!this.filters.propertyType ? 'active' : ''}" onclick="app.filterByType(null)">
                        <i class="fas fa-building"></i> All Types
                    </button>
                    ${['apartment', 'studio', 'hostel', 'bungalow', 'house', 'flat', 'shared'].map(type => {
                        const count = this.properties.filter(p => p.propertyType === type).length;
                        if (count === 0) return '';
                        return `
                            <button class="filter-pill ${this.filters.propertyType === type ? 'active' : ''}" onclick="app.filterByType('${type}')">
                                ${type.charAt(0).toUpperCase() + type.slice(1)}
                                <span class="count">${count}</span>
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="section-header">
                <span style="color: var(--text-secondary); font-size: 14px;">
                    <i class="fas fa-home"></i> ${filteredProps.length} properties found
                </span>
            </div>

            <div class="property-grid" style="margin-bottom: 20px;">
                ${filteredProps.length > 0 ? 
                    this.renderPropertyCards(filteredProps) : 
                    this.renderEmptyState()
                }
            </div>
        `;
    },

    renderFavorites() {
        const favoriteProps = this.properties.filter(p => this.favorites.includes(p.id));
        
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="logo">
                        <div class="logo-image">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232563EB' rx='20'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'%3EP%3C/text%3E%3C/svg%3E" alt="Primer">
                        </div>
                        <span class="logo-text">Saved</span>
                    </div>
                    <div class="header-actions">
                        <button class="icon-btn" onclick="app.navigate('explore')">
                            <i class="fas fa-search"></i>
                        </button>
                        <button class="icon-btn" onclick="app.toggleTheme()">
                            <i class="fas ${this.user.preferences.darkMode ? 'fa-sun' : 'fa-moon'}"></i>
                        </button>
                    </div>
                </div>
            </header>

            <div class="section-header" style="margin-top: 16px;">
                <h2>Your Favorites</h2>
            </div>
            
            ${favoriteProps.length > 0 ? `
                <div class="property-grid">
                    ${favoriteProps.map(prop => `
                        <div class="property-card" onclick="app.showPropertyDetails('${prop.id}')">
                            <div class="property-image">
                                <img src="${prop.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'}" alt="${this.escapeHtml(prop.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'">
                                <button class="favorite-btn favorited" onclick="event.stopPropagation(); app.toggleFavorite('${prop.id}')">
                                    <i class="fas fa-heart"></i>
                                </button>
                                ${prop.category === 'student' ? '<span class="property-badge student"><i class="fas fa-graduation-cap"></i> STUDENT</span>' : ''}
                            </div>
                            <div class="property-content">
                                <div class="property-header">
                                    <h3 class="property-title">${this.escapeHtml(prop.title)}</h3>
                                    <span class="property-price">₦${this.formatNaira(prop.price)}<span>/mo</span></span>
                                </div>
                                <div class="property-location">
                                    <i class="fas fa-map-pin"></i>
                                    <span>${this.escapeHtml(prop.location || 'Location available')}</span>
                                </div>
                                <div class="property-university">
                                    <i class="fas fa-university"></i>
                                    <span>${this.escapeHtml(prop.school || 'Near campus')}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <h3>No favorites yet</h3>
                    <p>Save properties you like to view them later</p>
                    <button onclick="app.navigate('explore')">
                        Browse Properties
                    </button>
                </div>
            `}
        `;
    },

    renderProfile() {
        const studentProps = this.properties.filter(p => p.category === 'student').length;
        
        if (this.isDesktop) {
            return this.renderDesktopProfile(studentProps);
        }
        return this.renderMobileProfile(studentProps);
    },

    renderDesktopProfile(studentProps) {
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="logo">
                        <div class="logo-image">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232563EB' rx='20'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'%3EP%3C/text%3E%3C/svg%3E" alt="Primer">
                        </div>
                        <span class="logo-text">Profile</span>
                    </div>
                    <div class="header-actions">
                        <button class="icon-btn" onclick="app.editProfile()">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="icon-btn" onclick="app.toggleTheme()">
                            <i class="fas ${this.user.preferences.darkMode ? 'fa-sun' : 'fa-moon'}"></i>
                        </button>
                    </div>
                </div>
            </header>

            <div class="desktop-layout">
                <div class="desktop-sidebar">
                    <div class="profile-section">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <div style="width: 100px; height: 100px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px; font-weight: 600; margin: 0 auto 16px; overflow: hidden;">
                                ${this.user.avatar ? `<img src="${this.escapeHtml(this.user.avatar)}" style="width: 100%; height: 100%; object-fit: cover;">` : this.escapeHtml(this.user.name.charAt(0))}
                            </div>
                            <h2 style="font-size: 24px; font-weight: 800;">${this.escapeHtml(this.user.name)}</h2>
                            <p style="color: var(--text-secondary);">${this.escapeHtml(this.user.email)}</p>
                        </div>

                        <div class="stats-grid" style="margin: 0 0 24px;">
                            <div class="stat-card">
                                <div class="stat-value">${this.favorites.length}</div>
                                <div class="stat-label">Saved</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${studentProps}</div>
                                <div class="stat-label">Student</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${this.properties.length}</div>
                                <div class="stat-label">Total</div>
                            </div>
                        </div>

                        <div style="margin-bottom: 24px;">
                            <h3 style="font-weight: 700; margin-bottom: 16px;">Contact</h3>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <i class="fas fa-phone" style="color: var(--primary); width: 20px;"></i>
                                    <span>${this.escapeHtml(this.user.phone)}</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <i class="fas fa-envelope" style="color: var(--primary); width: 20px;"></i>
                                    <span>${this.escapeHtml(this.user.email)}</span>
                                </div>
                                ${this.user.address ? `
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <i class="fas fa-map-pin" style="color: var(--primary); width: 20px;"></i>
                                        <span>${this.escapeHtml(this.user.address)}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="desktop-main">
                    <div style="background: var(--surface); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border); margin-bottom: 24px;">
                        <h3 style="font-weight: 700; margin-bottom: 20px;">Primer Technologies</h3>
                        
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                            <div style="width: 60px; height: 60px; background: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 30px; font-weight: 700;">
                                P
                            </div>
                            <div>
                                <h4 style="font-weight: 700;">Making housing smarter</h4>
                                <p style="color: var(--text-secondary);">get.primer@proton.me</p>
                            </div>
                        </div>

                        <div class="social-links">
                            <a href="#" class="social-link" onclick="event.preventDefault(); window.open('https://facebook.com/primertech', '_blank')">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="#" class="social-link" onclick="event.preventDefault(); window.open('https://twitter.com/primertech', '_blank')">
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="#" class="social-link" onclick="event.preventDefault(); window.open('https://instagram.com/primertech', '_blank')">
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="#" class="social-link" onclick="event.preventDefault(); window.open('https://linkedin.com/company/primertech', '_blank')">
                                <i class="fab fa-linkedin-in"></i>
                            </a>
                        </div>
                    </div>

                    <div style="background: var(--surface); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border);">
                        <h3 style="font-weight: 700; margin-bottom: 16px;">Settings</h3>
                        
                        <div class="links-list">
                            <div class="link-item" onclick="app.toggleTheme()">
                                <div class="link-item-left">
                                    <i class="fas ${this.user.preferences.darkMode ? 'fa-sun' : 'fa-moon'}"></i>
                                    <span>${this.user.preferences.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                </div>
                                <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                            </div>

                            <div class="link-item" onclick="app.openNotificationsDropdown()">
                                <div class="link-item-left">
                                    <i class="fas fa-bell"></i>
                                    <span>Notifications: <span style="color: var(--primary); font-weight: 600;">${this.user.notifications === 'enabled' ? 'Enabled' : 'Disabled'}</span></span>
                                </div>
                                <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                            </div>

                            <div class="link-item" onclick="window.location.href='services.html'">
                                <div class="link-item-left">
                                    <i class="fas fa-bolt"></i>
                                    <span>Services</span>
                                </div>
                                <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                            </div>

                            <div class="link-item" onclick="window.location.href='terms.html'">
                                <div class="link-item-left">
                                    <i class="fas fa-file-contract"></i>
                                    <span>Terms of Service</span>
                                </div>
                                <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                            </div>

                            <div class="link-item" onclick="window.location.href='policy.html'">
                                <div class="link-item-left">
                                    <i class="fas fa-shield-alt"></i>
                                    <span>Privacy Policy</span>
                                </div>
                                <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                            </div>

                            <div class="link-item" onclick="window.location.href='about.html'">
                                <div class="link-item-left">
                                    <i class="fas fa-info-circle"></i>
                                    <span>About</span>
                                </div>
                                <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 24px; text-align: center; padding: 24px;">
                        <p style="color: var(--text-tertiary); font-size: 12px;">© 2026 Primer Technologies. All rights reserved.</p>
                        <p style="color: var(--text-tertiary); font-size: 12px; margin-top: 4px;">get.primer@proton.me</p>
                    </div>
                </div>
            </div>
        `;
    },

    renderMobileProfile(studentProps) {
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="logo">
                        <div class="logo-image">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232563EB' rx='20'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'%3EP%3C/text%3E%3C/svg%3E" alt="Primer">
                        </div>
                        <span class="logo-text">Profile</span>
                    </div>
                    <div class="header-actions">
                        <button class="icon-btn" onclick="app.editProfile()">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="icon-btn" onclick="app.toggleTheme()">
                            <i class="fas ${this.user.preferences.darkMode ? 'fa-sun' : 'fa-moon'}"></i>
                        </button>
                    </div>
                </div>
            </header>

            <div style="padding: 20px; max-width: 480px; margin: 0 auto;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    <div style="width: 70px; height: 70px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: 600; overflow: hidden;">
                        ${this.user.avatar ? `<img src="${this.escapeHtml(this.user.avatar)}" style="width: 100%; height: 100%; object-fit: cover;">` : this.escapeHtml(this.user.name.charAt(0))}
                    </div>
                    <div>
                        <h2 style="font-size: 20px; font-weight: 800;">${this.escapeHtml(this.user.name)}</h2>
                        <p style="color: var(--text-secondary); font-size: 13px;">${this.escapeHtml(this.user.email)}</p>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${this.favorites.length}</div>
                        <div class="stat-label">Saved</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${studentProps}</div>
                        <div class="stat-label">Student</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.properties.length}</div>
                        <div class="stat-label">Total</div>
                    </div>
                </div>

                <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 20px;">
                    <h3 style="font-weight: 700; margin-bottom: 16px;">Contact</h3>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-phone" style="color: var(--primary); width: 20px;"></i>
                            <span style="font-size: 14px;">${this.escapeHtml(this.user.phone)}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-envelope" style="color: var(--primary); width: 20px;"></i>
                            <span style="font-size: 14px;">${this.escapeHtml(this.user.email)}</span>
                        </div>
                        ${this.user.address ? `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <i class="fas fa-map-pin" style="color: var(--primary); width: 20px;"></i>
                                <span style="font-size: 14px;">${this.escapeHtml(this.user.address)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 20px;">
                    <h3 style="font-weight: 700; margin-bottom: 16px;">Primer Technologies</h3>
                    
                    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                        <div style="width: 48px; height: 48px; background: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 700;">
                            P
                        </div>
                        <div>
                            <h4 style="font-weight: 700;">Making housing smarter</h4>
                            <p style="color: var(--text-secondary); font-size: 12px;">get.primer@proton.me</p>
                        </div>
                    </div>

                    <div class="social-links">
                        <a href="#" class="social-link" onclick="event.preventDefault(); window.open('https://facebook.com/primertech', '_blank')">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="#" class="social-link" onclick="event.preventDefault(); window.open('https://twitter.com/primertech', '_blank')">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="#" class="social-link" onclick="event.preventDefault(); window.open('https://instagram.com/primertech', '_blank')">
                            <i class="fab fa-instagram"></i>
                        </a>
                        <a href="#" class="social-link" onclick="event.preventDefault(); window.open('https://linkedin.com/company/primertech', '_blank')">
                            <i class="fab fa-linkedin-in"></i>
                        </a>
                    </div>
                </div>

                <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px;">
                    <div class="links-list">
                        <div class="link-item" onclick="app.toggleTheme()">
                            <div class="link-item-left">
                                <i class="fas ${this.user.preferences.darkMode ? 'fa-sun' : 'fa-moon'}"></i>
                                <span>${this.user.preferences.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                            </div>
                            <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                        </div>

                        <div class="link-item" onclick="app.openNotificationsDropdown()">
                            <div class="link-item-left">
                                <i class="fas fa-bell"></i>
                                <span>Notifications: <span style="color: var(--primary); font-weight: 600;">${this.user.notifications === 'enabled' ? 'Enabled' : 'Disabled'}</span></span>
                            </div>
                            <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                        </div>

                        <div class="link-item" onclick="window.location.href='services.html'">
                            <div class="link-item-left">
                                <i class="fas fa-bolt"></i>
                                <span>Services</span>
                            </div>
                            <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                        </div>

                        <div class="link-item" onclick="window.location.href='terms.html'">
                            <div class="link-item-left">
                                <i class="fas fa-file-contract"></i>
                                <span>Terms of Service</span>
                            </div>
                            <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                        </div>

                        <div class="link-item" onclick="window.location.href='policy.html'">
                            <div class="link-item-left">
                                <i class="fas fa-shield-alt"></i>
                                <span>Privacy Policy</span>
                            </div>
                            <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                        </div>

                        <div class="link-item" onclick="window.location.href='about.html'">
                            <div class="link-item-left">
                                <i class="fas fa-info-circle"></i>
                                <span>About</span>
                            </div>
                            <i class="fas fa-chevron-right" style="color: var(--text-tertiary);"></i>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 30px; padding: 20px; text-align: center;">
                    <p style="color: var(--text-tertiary); font-size: 11px;">© 2026 Primer Technologies. All rights reserved.</p>
                    <p style="color: var(--text-tertiary); font-size: 11px; margin-top: 4px;">get.primer@proton.me</p>
                </div>
            </div>
        `;
    },

    renderPropertyCards(properties) {
        if (!properties || properties.length === 0) {
            return '<div class="empty-state"><p>No properties available</p></div>';
        }
        
        return properties.map(prop => {
            const id = this.escapeHtml(prop.id || '');
            const title = this.escapeHtml(prop.title || 'Property');
            const price = prop.price || 0;
            const location = this.escapeHtml(prop.location || 'Location available');
            const school = this.escapeHtml(prop.school || 'Near campus');
            const imageUrl = prop.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600';
            const propertyType = this.escapeHtml(prop.propertyType || 'apartment');
            const distance = this.escapeHtml(prop.distance || 'Walkable');
            const landlordName = this.escapeHtml(prop.landlord?.name || prop.agent?.name || 'Property Manager');
            const landlordRating = prop.landlord?.rating || prop.agent?.rating || '4.5';
            const isFavorited = this.favorites.includes(prop.id);
            
            let typeIcon = 'building';
            if (propertyType === 'studio') typeIcon = 'microphone';
            else if (propertyType === 'hostel') typeIcon = 'users';
            else if (propertyType === 'bungalow') typeIcon = 'home';
            else if (propertyType === 'flat') typeIcon = 'building';
            
            return `
                <div class="property-card" onclick="app.showPropertyDetails('${id}')">
                    <div class="property-image">
                        <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'">
                        
                        ${prop.isNew ? '<span class="property-badge new"><i class="fas fa-bolt"></i> NEW</span>' : ''}
                        ${prop.isPopular ? '<span class="property-badge popular"><i class="fas fa-fire"></i> POPULAR</span>' : ''}
                        ${prop.category === 'student' ? '<span class="property-badge student"><i class="fas fa-graduation-cap"></i> STUDENT</span>' : ''}
                        
                        <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" onclick="event.stopPropagation(); app.toggleFavorite('${id}')">
                            <i class="fas fa-heart"></i>
                        </button>
                        
                        <span class="property-type">
                            <i class="fas fa-${typeIcon}"></i>
                            ${propertyType}
                        </span>
                    </div>
                    
                    <div class="property-content">
                        <div class="property-header">
                            <h3 class="property-title">${title}</h3>
                            <span class="property-price">₦${this.formatNaira(price)}<span>/mo</span></span>
                        </div>
                        
                        <div class="property-location">
                            <i class="fas fa-map-pin"></i>
                            <span>${location}</span>
                        </div>
                        
                        <div class="property-university">
                            <i class="fas fa-university"></i>
                            <span>${school}</span>
                            <span style="margin-left: auto; font-size: 11px; color: var(--text-secondary);"><i class="fas fa-walking"></i> ${distance}</span>
                        </div>
                        
                        <div class="property-features">
                            ${prop.features?.slice(0, 3).map(f => {
                                const featureText = typeof f === 'string' ? f : (f.label || '');
                                const icon = typeof f === 'object' && f.icon ? f.icon : 'check-circle';
                                return `
                                    <span class="feature">
                                        <i class="fas fa-${icon}"></i> ${this.escapeHtml(featureText)}
                                    </span>
                                `;
                            }).join('') || `
                                <span class="feature">
                                    <i class="fas fa-bed"></i> ${prop.bedrooms || 1} bed
                                </span>
                                <span class="feature">
                                    <i class="fas fa-bath"></i> ${prop.bathrooms || 1} bath
                                </span>
                            `}
                        </div>
                        
                        <div class="property-footer">
                            <div class="landlord-info">
                                <div class="landlord-avatar">
                                    ${landlordName.charAt(0)}
                                </div>
                                <div class="landlord-details">
                                    <div class="landlord-name">${landlordName}</div>
                                    <div class="landlord-rating">
                                        <i class="fas fa-star"></i> ${landlordRating}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="distance">
                                <i class="fas fa-walking"></i>
                                <span>${distance.split(',')[0]}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-home"></i>
                <h3>No properties found</h3>
                <p>Try adjusting your filters or search query</p>
                <button onclick="app.clearFilters()">
                    Clear Filters
                </button>
            </div>
        `;
    },

    showPropertyDetails(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) {
            this.showToast('Property not found', 'error');
            return;
        }
        
        this.currentProperty = property;
        this.openPropertyModal(property);
    },

    openPropertyModal(property) {
        const sheet = document.getElementById('modalSheet');
        this.modalOpen = true;
        
        const escapeHtml = (text) => {
            if (!text) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };
        
        const title = escapeHtml(property.title);
        const price = property.price || 0;
        const location = escapeHtml(property.location || 'Location available');
        const school = escapeHtml(property.school || 'Near campus');
        const distance = escapeHtml(property.distance || '');
        const description = escapeHtml(property.description || '');
        const landlordName = escapeHtml(property.landlord?.name || property.agent?.name || 'Property Manager');
        const landlordPhone = escapeHtml(property.landlord?.phone || property.agent?.phone || '+234 800 000 0000');
        const landlordRating = property.landlord?.rating || property.agent?.rating || '4.5';
        const mainImage = property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
        const isFavorited = this.favorites.includes(property.id);
        
        sheet.innerHTML = `
            <div class="modal-header">
                <h3>Property Details</h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                <div style="position: relative; margin-bottom: 16px;">
                    <img src="${mainImage}" 
                         style="width: 100%; height: 300px; object-fit: cover; border-radius: var(--radius-lg);" 
                         id="mainPropertyImage"
                         onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'">
                    
                    <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
                            style="position: absolute; top: 16px; right: 16px;"
                            onclick="event.stopPropagation(); app.toggleFavorite('${property.id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                
                ${property.images?.length > 1 ? `
                    <div class="gallery-scroll">
                        ${property.images.map((img, idx) => `
                            <img src="${img}" class="gallery-thumb ${idx === 0 ? 'active' : ''}" 
                                 onclick="app.swapMainImage('${img}')"
                                 onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200'">
                        `).join('')}
                    </div>
                ` : ''}
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 20px 0;">
                    <h2 style="font-size: 20px; font-weight: 800;">${title}</h2>
                    <div style="text-align: right;">
                        <span style="font-size: 24px; font-weight: 800; color: var(--primary);">₦${this.formatNaira(price)}</span>
                        <span style="display: block; font-size: 12px; color: var(--text-secondary);">per month</span>
                    </div>
                </div>
                
                <div style="background: var(--surface-hover); padding: 16px; border-radius: var(--radius-lg); margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <i class="fas fa-map-pin" style="color: var(--primary);"></i>
                        <span>${location}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-university" style="color: var(--secondary);"></i>
                        <span>${school}</span>
                        ${distance ? `<span style="margin-left: auto; color: var(--text-secondary); font-size: 12px;"><i class="fas fa-walking"></i> ${distance}</span>` : ''}
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="font-weight: 600; margin-bottom: 12px;">Features</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${property.features?.map(f => {
                            const featureText = typeof f === 'string' ? f : (f.label || '');
                            const icon = typeof f === 'object' && f.icon ? f.icon : 'check-circle';
                            return `
                                <span class="feature" style="padding: 6px 12px;">
                                    <i class="fas fa-${icon}"></i> ${escapeHtml(featureText)}
                                </span>
                            `;
                        }).join('') || `
                            <span class="feature"><i class="fas fa-bed"></i> ${property.bedrooms || 1} Bedrooms</span>
                            <span class="feature"><i class="fas fa-bath"></i> ${property.bathrooms || 1} Bathrooms</span>
                        `}
                    </div>
                </div>
                
                ${property.amenities ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="font-weight: 600; margin-bottom: 12px;">Amenities</h4>
                        <div class="amenities-grid">
                            ${property.amenities.map(a => `
                                <div class="amenity-item">
                                    <i class="fas fa-check-circle"></i>
                                    <span>${escapeHtml(a)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${description ? `
                    <div style="margin-bottom: 20px;">
                        <h4 style="font-weight: 600; margin-bottom: 12px;">About</h4>
                        <p style="color: var(--text-secondary); line-height: 1.6; font-size: 14px;">
                            ${description}
                        </p>
                    </div>
                ` : ''}
                
                <div style="margin-bottom: 20px;">
                    <h4 style="font-weight: 600; margin-bottom: 12px;">Contact</h4>
                    <div class="contact-card">
                        <div class="contact-info">
                            <div class="contact-avatar">
                                ${landlordName.charAt(0)}
                            </div>
                            <div class="contact-details">
                                <h4>${landlordName}</h4>
                                <p>
                                    <i class="fas fa-star" style="color: #F59E0B;"></i>
                                    ${landlordRating} • 
                                    ${property.landlord ? 'Landlord' : 'Agent'}
                                </p>
                            </div>
                        </div>
                        <a href="tel:${landlordPhone.replace(/\s/g, '')}" style="text-decoration: none;">
                            <button class="contact-btn">
                                <i class="fas fa-phone"></i>
                                Call
                            </button>
                        </a>
                    </div>
                    <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                        <i class="fas fa-phone-alt"></i> ${landlordPhone}
                    </p>
                </div>
            </div>
        `;
        
        this.openModal();
    },

    showFilters() {
        const sheet = document.getElementById('modalSheet');
        this.modalOpen = true;
        
        sheet.innerHTML = `
            <div class="modal-header">
                <h3>Filters</h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                <div style="margin-bottom: 24px;">
                    <h4 style="font-weight: 600; margin-bottom: 12px;">Max Price (₦)</h4>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                        ${[null, 50000, 100000, 150000, 200000, 300000].map(price => `
                            <button class="filter-pill" style="justify-content: center; width: 100%; ${this.filters.maxPrice === price ? 'active' : ''}" onclick="app.setMaxPrice(${price === null ? 'null' : price})">
                                ${price ? `₦${this.formatNaira(price)}` : 'Any'}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <h4 style="font-weight: 600; margin-bottom: 12px;">Bedrooms</h4>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                        ${['any', '1', '2', '3+'].map(bed => `
                            <button class="filter-pill" style="justify-content: center; ${this.filters.bedrooms === bed ? 'active' : ''}" onclick="app.setBedrooms('${bed}')">
                                ${bed === 'any' ? 'Any' : bed}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <h4 style="font-weight: 600; margin-bottom: 12px;">Property Type</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${['apartment', 'studio', 'hostel', 'house', 'flat', 'bungalow', 'shared'].map(type => {
                            const count = this.properties.filter(p => p.propertyType === type).length;
                            if (count === 0) return '';
                            return `
                                <button class="filter-pill ${this.filters.propertyType === type ? 'active' : ''}" onclick="app.setPropertyType('${type}')">
                                    ${type.charAt(0).toUpperCase() + type.slice(1)}
                                    <span class="count">${count}</span>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <button class="contact-btn" style="width: 100%; justify-content: center; margin-top: 16px;" onclick="app.clearFilters()">
                    Clear All Filters
                </button>
            </div>
        `;
        
        this.openModal();
    },

    openNotificationsDropdown() {
        const sheet = document.getElementById('modalSheet');
        this.modalOpen = true;
        
        sheet.innerHTML = `
            <div class="modal-header">
                <h3>Notification Settings</h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                <div style="margin-bottom: 24px;">
                    <h4 style="font-weight: 600; margin-bottom: 12px;">Choose notification preference</h4>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div class="filter-pill" style="width: 100%; justify-content: space-between; ${this.user.notifications === 'enabled' ? 'active' : ''}" onclick="app.setNotifications('enabled')">
                            <span><i class="fas fa-check-circle"></i> Enabled</span>
                            ${this.user.notifications === 'enabled' ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                        <div class="filter-pill" style="width: 100%; justify-content: space-between; ${this.user.notifications === 'disabled' ? 'active' : ''}" onclick="app.setNotifications('disabled')">
                            <span><i class="fas fa-times-circle"></i> Disabled</span>
                            ${this.user.notifications === 'disabled' ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                        <div class="filter-pill" style="width: 100%; justify-content: space-between; ${this.user.notifications === 'important' ? 'active' : ''}" onclick="app.setNotifications('important')">
                            <span><i class="fas fa-exclamation-circle"></i> Important Only</span>
                            ${this.user.notifications === 'important' ? '<i class="fas fa-check"></i>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.openModal();
    },

    setNotifications(value) {
        this.user.notifications = value;
        this.saveUserData();
        this.closeModal();
        this.render();
        this.showToast(`Notifications ${value === 'enabled' ? 'enabled' : value === 'disabled' ? 'disabled' : 'set to important only'}`, 'success');
    },

    editProfile() {
        const sheet = document.getElementById('modalSheet');
        this.modalOpen = true;
        
        sheet.innerHTML = `
            <div class="modal-header">
                <h3>Edit Profile</h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" class="form-input" id="editName" value="${this.escapeHtml(this.user.name)}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" id="editEmail" value="${this.escapeHtml(this.user.email)}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-input" id="editPhone" value="${this.escapeHtml(this.user.phone)}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Address</label>
                    <input type="text" class="form-input" id="editAddress" value="${this.escapeHtml(this.user.address || '')}" placeholder="Your address">
                </div>
                
                <button class="contact-btn" style="width: 100%; justify-content: center; margin-top: 16px;" onclick="app.saveProfile()">
                    Save Changes
                </button>
            </div>
        `;
        
        this.openModal();
    },

    saveProfile() {
        const name = document.getElementById('editName')?.value;
        const email = document.getElementById('editEmail')?.value;
        const phone = document.getElementById('editPhone')?.value;
        const address = document.getElementById('editAddress')?.value;
        
        if (name) this.user.name = name;
        if (email) this.user.email = email;
        if (phone) this.user.phone = phone;
        if (address !== undefined) this.user.address = address;
        
        this.saveUserData();
        this.closeModal();
        this.render();
        this.showToast('Profile updated successfully', 'success');
    },

    filterProperties() {
        return this.properties.filter(prop => {
            try {
                if (this.filters.category !== 'all' && prop.category !== this.filters.category) return false;
                
                if (this.filters.university && prop.school !== this.filters.university) return false;
                
                if (this.filters.propertyType && prop.propertyType !== this.filters.propertyType) return false;
                
                if (this.filters.maxPrice && prop.price > this.filters.maxPrice) return false;
                
                if (this.filters.bedrooms !== 'any') {
                    const beds = prop.bedrooms || 1;
                    if (this.filters.bedrooms === '3+' && beds < 3) return false;
                    if (this.filters.bedrooms !== '3+' && beds !== parseInt(this.filters.bedrooms)) return false;
                }
                
                if (this.searchQuery) {
                    const q = this.searchQuery.toLowerCase();
                    return (prop.title?.toLowerCase().includes(q) ||
                           prop.school?.toLowerCase().includes(q) ||
                           prop.location?.toLowerCase().includes(q) ||
                           prop.propertyType?.toLowerCase().includes(q));
                }
                
                return true;
            } catch (error) {
                console.warn('Filter error:', error);
                return true;
            }
        });
    },

    handleSearchInput(value) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = setTimeout(() => {
            this.searchQuery = value;
            if (this.currentPage === 'explore' || this.currentPage === 'home') {
                this.render();
            }
        }, 300);
    },

    filterByUniversity(uni) {
        this.filters.university = uni;
        this.filters.category = 'all';
        this.navigate('explore');
    },

    filterByCategory(cat) {
        this.filters.category = cat;
        if (this.currentPage !== 'explore') {
            this.navigate('explore');
        } else {
            this.render();
        }
    },

    filterByType(type) {
        this.filters.propertyType = type;
        this.render();
    },

    setMaxPrice(price) {
        this.filters.maxPrice = price === 'null' ? null : price;
        this.closeModal();
        this.render();
    },

    setBedrooms(bed) {
        this.filters.bedrooms = bed;
        this.closeModal();
        this.render();
    },

    setPropertyType(type) {
        this.filters.propertyType = this.filters.propertyType === type ? null : type;
        this.closeModal();
        this.render();
    },

    clearFilters() {
        this.filters = {
            category: 'all',
            university: null,
            propertyType: null,
            maxPrice: null,
            bedrooms: 'any'
        };
        this.searchQuery = '';
        this.closeModal();
        this.render();
        this.showToast('Filters cleared', 'info');
    },

    toggleFavorite(id) {
        const wasFavorited = this.favorites.includes(id);
        
        if (wasFavorited) {
            this.favorites = this.favorites.filter(f => f !== id);
            this.showToast('Removed from favorites', 'info');
        } else {
            this.favorites.push(id);
            this.showToast('Saved to favorites', 'success');
        }
        
        try {
            localStorage.setItem('primer_favorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.warn('Failed to save favorites:', error);
        }
        
        this.updateFABBadge();
        
        if (this.currentPage === 'favorites') {
            this.render();
        }
    },

    updateFABBadge() {
        const badge = document.getElementById('favoritesFabBadge');
        if (badge) {
            if (this.favorites.length > 0) {
                badge.style.display = 'block';
                badge.textContent = this.favorites.length;
            } else {
                badge.style.display = 'none';
            }
        }
    },

    swapMainImage(src) {
        const mainImg = document.getElementById('mainPropertyImage');
        if (mainImg) mainImg.src = src;
        
        document.querySelectorAll('.gallery-thumb').forEach(thumb => {
            thumb.classList.remove('active');
            if (thumb.src === src) thumb.classList.add('active');
        });
    },

    formatNaira(amount) {
        if (!amount) return '0';
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    openModal() {
        document.getElementById('modalBackdrop').classList.add('active');
        document.getElementById('modalSheet').classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        document.getElementById('modalBackdrop').classList.remove('active');
        document.getElementById('modalSheet').classList.remove('active');
        document.body.style.overflow = '';
        this.modalOpen = false;
    },

    navigate(page, direction = 'left') {
        // Close FAB menu if open
        if (this.fabMenuOpen) {
            this.toggleFabMenu();
        }
        
        if (this.currentPage === page) return;
        
        const appElement = document.getElementById('app');
        appElement.classList.remove('page-transition-left', 'page-transition-right');
        appElement.classList.add(direction === 'left' ? 'page-transition-left' : 'page-transition-right');
        
        setTimeout(() => {
            this.currentPage = page;
            window.location.hash = page;
            this.render();
            this.closeModal();
            window.scrollTo(0, 0);
            
            setTimeout(() => {
                appElement.classList.remove('page-transition-left', 'page-transition-right');
            }, 300);
        }, 50);
    },

    toggleTheme() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', next);
        localStorage.setItem('primer_theme', next);
        this.user.preferences.darkMode = next === 'dark';
        this.saveUserData();
        
        this.render();
        this.showToast(`${next === 'dark' ? '🌙' : '☀️'} Dark mode ${next === 'dark' ? 'enabled' : 'disabled'}`, 'info');
    },

    applyTheme() {
        const theme = localStorage.getItem('primer_theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        else if (type === 'error') icon = 'fa-exclamation-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${this.escapeHtml(message)}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 200);
        }, 3000);
    },

    setupEventListeners() {
        window.addEventListener('popstate', () => {
            const hash = window.location.hash.replace('#', '') || 'home';
            this.navigate(hash);
        });
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const wasDesktop = this.isDesktop;
                this.isDesktop = window.innerWidth > 768;
                if (wasDesktop !== this.isDesktop && this.currentPage === 'profile') {
                    this.render();
                }
            }, 150);
        });
        
        window.addEventListener('scroll', () => {
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }
            this.scrollTimeout = setTimeout(() => {
                this.checkScroll();
            }, 50);
        });
        
        const backdrop = document.getElementById('modalBackdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeModal());
        }
        
        const sheet = document.getElementById('modalSheet');
        if (sheet) {
            sheet.addEventListener('click', (e) => e.stopPropagation());
        }

        // Close FAB menu when clicking outside
        document.addEventListener('click', (e) => {
            const fabContainer = document.getElementById('fabContainer');
            if (this.fabMenuOpen && fabContainer && !fabContainer.contains(e.target)) {
                this.toggleFabMenu();
            }
        });
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = app;
    app.init();
});