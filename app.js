// app.js - Complete Primer Housing Application (Regular + Student Listings)
// FIXED: Map disabled - showing coming soon

const app = {
    // ============================================
    // APP STATE & CONFIGURATION
    // ============================================
    
    currentPage: 'home',
    currentProperty: null,
    favorites: JSON.parse(localStorage.getItem('favorites')) || [],
    bookings: JSON.parse(localStorage.getItem('bookings')) || [],
    properties: [],
    schools: [],
    dynamicContent: {
        banners: [],
        hero: {}
    },
    currentView: 'grid',
    currentGalleryIndex: 0,
    currentGalleryImages: [],
    searchQuery: '',
    currentBannerIndex: 0,
    bannerInterval: null,
    currentUniversity: null,
    
    userProfile: JSON.parse(localStorage.getItem('userProfile')) || {
        name: 'Me',
        email: 'Me@email.com',
        phone: '+234 801 234 5678',
        avatar: null,
        address: 'Off K, UNILAG, Lagos',
        memberSince: '2026',
        preferences: {
            notifications: true,
            darkMode: localStorage.getItem('theme') === 'dark'
        }
    },
    
    // MAP PROPERTIES - DISABLED
    map: null,
    mapInitialized: false,
    mapMarkers: [],
    mapBounds: null,
    userLocation: null,
    
    currentFilters: {
        priceMin: 0,
        priceMax: 500000,
        bedrooms: 'any',
        bathrooms: 'any',
        propertyType: 'any'
    },

    // ============================================
    // INITIALIZATION
    // ============================================
    
    async init() {
        try {
            await this.loadData();
            await this.getUserLocation();
            this.applyTheme();
            this.render();
            this.setupEventListeners();
            this.startBannerRotation();
            this.hideLoadingScreen();
            
            const hash = window.location.hash || '#home';
            this.navigate(hash.replace('#', ''));
        } catch (error) {
            console.error('Initialization error:', error);
            this.showToast('Failed to load data. Please refresh.', 'error');
            this.hideLoadingScreen();
        }
    },

    async loadData() {
        try {
            // Load properties from GitHub
            const propertiesResponse = await fetch('https://raw.githubusercontent.com/Uppar-ng/Uppar-ng/main/properties.json');
            const data = await propertiesResponse.json();
            
            // Ensure properties is an array
            this.properties = Array.isArray(data.properties) ? data.properties : [];
            this.schools = Array.isArray(data.schools) ? data.schools : [];
            
            console.log(`Loaded ${this.properties.length} properties`);
            console.log('Sample property coordinates:', this.properties[0]?.coordinates);
            
            // Load dynamic banner content
            const dynamicResponse = await fetch('https://raw.githubusercontent.com/Uppar-ng/Uppar-ng/main/dynamic.json');
            const dynamicData = await dynamicResponse.json();
            this.dynamicContent = dynamicData || { 
                banners: [
                    {
                        id: 1,
                        icon: 'fa-home',
                        title: 'Find Your Perfect Home',
                        description: 'Browse apartments, houses, and student accommodations'
                    },
                    {
                        id: 2,
                        icon: 'fa-bolt',
                        title: '24/7 Electricity',
                        description: 'Properties with guaranteed power'
                    }
                ], 
                hero: {
                    title: 'Find Your Perfect Home in Nigeria',
                    subtitle: 'Discover verified apartments, houses, and student accommodations'
                } 
            };
            
            return Promise.resolve();
        } catch (error) {
            console.error('Error loading data:', error);
            this.properties = this.getDefaultProperties();
            this.schools = [];
            this.dynamicContent = { 
                banners: [
                    {
                        id: 1,
                        icon: 'fa-home',
                        title: 'Find Your Perfect Home',
                        description: 'Browse apartments, houses, and student accommodations'
                    },
                    {
                        id: 2,
                        icon: 'fa-bolt',
                        title: '24/7 Electricity',
                        description: 'Properties with guaranteed power'
                    }
                ], 
                hero: {
                    title: 'Find Your Perfect Home in Nigeria',
                    subtitle: 'Discover verified apartments, houses, and student accommodations'
                }
            };
        }
    },

    getDefaultProperties() {
        return [
            {
                id: 'prop1',
                title: 'Modern Studio Apartment',
                location: 'Near University Campus',
                school: 'Kaduna State University',
                type: 'studio',
                price: 120000,
                priceDisplay: '₦120,000/month',
                coordinates: [6.5244, 3.3792],
                landlord: {
                    name: 'Mr. Adebayo',
                    phone: '+2348012345678',
                    rating: 4.8
                },
                images: [
                    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500',
                    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500'
                ],
                features: [
                    { icon: 'bed', label: '1 Bed' },
                    { icon: 'bath', label: '1 Bath' },
                    { icon: 'wifi', label: 'WiFi' },
                    { icon: 'square', label: '45 m²' }
                ],
                distance: '0.5km from campus',
                amenities: ['Fully Furnished', '24/7 Security', 'Study Area', 'Laundry Room'],
                description: 'Modern studio apartment perfect for students or young professionals. Fully furnished with high-speed internet and secure access.',
                addedDate: new Date().toISOString(),
                isNew: true,
                region: 'south'
            },
            {
                id: 'prop2',
                title: '3-Bedroom Family Home',
                location: 'GRA, Port Harcourt',
                school: 'University of Port Harcourt',
                type: 'house',
                price: 350000,
                priceDisplay: '₦350,000/month',
                coordinates: [4.8156, 7.0498],
                landlord: {
                    name: 'Chief Mrs. Eze',
                    phone: '+2348123456789',
                    rating: 4.9
                },
                images: [
                    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500',
                    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500'
                ],
                features: [
                    { icon: 'bed', label: '3 Beds' },
                    { icon: 'bath', label: '2 Baths' },
                    { icon: 'car', label: 'Parking' },
                    { icon: 'square', label: '180 m²' }
                ],
                distance: '3km from town',
                amenities: ['Gated Community', '24/7 Security', 'Backup Generator', 'Staff Quarters'],
                description: 'Spacious family home in secure GRA neighborhood. Perfect for professionals or families.',
                addedDate: '2025-05-15',
                isNew: true,
                region: 'south'
            },
            {
                id: 'prop_north1',
                title: 'Maitama Luxury Apartment',
                location: 'Maitama, Abuja',
                school: 'University of Abuja',
                type: 'luxury_apartment',
                price: 250000,
                priceDisplay: '₦250,000/month',
                coordinates: [9.0765, 7.3986],
                landlord: {
                    name: 'Alhaji Sani',
                    phone: '+2348098765432',
                    rating: 4.9
                },
                images: [
                    'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=500',
                    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=500'
                ],
                features: [
                    { icon: 'bed', label: '3 Beds' },
                    { icon: 'bath', label: '2 Baths' },
                    { icon: 'wifi', label: 'High-speed WiFi' },
                    { icon: 'square', label: '120 m²' }
                ],
                distance: '5km from University of Abuja',
                amenities: ['Swimming Pool', '24/7 Security', 'Gym', 'Parking', 'Generator'],
                description: 'Luxury apartment in prestigious Maitama district. Fully furnished with modern amenities and excellent security.',
                addedDate: '2025-05-23',
                isNew: true,
                region: 'north'
            }
        ];
    },

    async getUserLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.log('Geolocation not supported');
                this.userLocation = { lat: 9.081999, lng: 8.675277 }; // Center of Nigeria
                resolve();
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('User location found:', this.userLocation);
                    resolve();
                },
                (error) => {
                    console.log('Geolocation error:', error.message);
                    this.userLocation = { lat: 9.081999, lng: 8.675277 }; // Center of Nigeria
                    resolve();
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    },

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    },

    // ============================================
    // MAP INTEGRATION - DISABLED
    // ============================================
    
    initMap() {
        // MAP DISABLED - COMING SOON
        console.log('Map view is coming soon!');
        this.showToast('🗺️ Map view is coming soon!', 'info');
        return;
    },

    addAllMapMarkers() {
        // MAP DISABLED - COMING SOON
        return;
    },
    
    refreshMap() {
        // MAP DISABLED - COMING SOON
        return;
    },

    // ============================================
    // RENDERING ENGINE
    // ============================================
    
    render() {
        const appContainer = document.getElementById('app');
        if (!appContainer) return;
        
        try {
            switch(this.currentPage) {
                case 'home':
                    appContainer.innerHTML = this.renderHome();
                    setTimeout(() => this.startBannerRotation(), 100);
                    break;
                case 'browse':
                    appContainer.innerHTML = this.renderBrowse();
                    break;
                case 'services':
                    // Redirect to external services page
                    window.location.href = 'services.html';
                    return;
                case 'favorites':
                    appContainer.innerHTML = this.renderFavorites();
                    break;
                case 'profile':
                    appContainer.innerHTML = this.renderProfile();
                    break;
                default:
                    appContainer.innerHTML = this.renderHome();
                    setTimeout(() => this.startBannerRotation(), 100);
            }
            
            this.updateActiveNav();
        } catch (error) {
            console.error('Render error:', error);
            appContainer.innerHTML = '<div style="padding: var(--space-3xl); text-align: center;">Error loading page. Please refresh.</div>';
        }
    },

    // ============================================
    // HOME PAGE
    // ============================================
    
    renderHome() {
        const featuredProperties = Array.isArray(this.properties) ? this.properties.slice(0, 6) : [];
        
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="header-left">
                        <div class="header-logo">
                            <img src="logo.png" alt="Primer" onerror="this.style.display='none';this.parentElement.innerHTML='JP';this.parentElement.style.background='var(--primary-gradient)';this.parentElement.style.color='white';">
                        </div>
                        <div class="header-info">
                            <h1>Primer</h1>
                            <p>Housing • Nigeria</p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="theme-toggle" onclick="app.toggleTheme()">
                            <i class="fas ${this.userProfile.preferences.darkMode ? 'fa-sun' : 'fa-moon'}"></i>
                        </button>
                    </div>
                </div>
            </header>
            
            <section class="hero-section" style="background: var(--primary-gradient);">
                <div class="hero-content">
                    <h1 class="hero-title">${this.dynamicContent.hero?.title || 'Find Your Perfect Home in Nigeria'}</h1>
                    <p class="hero-subtitle">${this.dynamicContent.hero?.subtitle || 'Discover verified apartments, houses, and student accommodations'}</p>
                </div>
            </section>
            
            <!-- SERVICE BUTTONS - Only Get App remains -->
            <div style="padding: var(--space-lg) var(--space-xl); overflow-x: auto; white-space: nowrap; scrollbar-width: none; -ms-overflow-style: none;">
                <div style="display: inline-flex; gap: var(--space-sm);">
                    <button class="btn btn-primary" style="border-radius: 32px;" onclick="window.location.href='https://b98ce7b9.mobsted.com/pwa/?appid=17'">
                        <i class="fas fa-mobile-alt"></i> Get app
                    </button>
                </div>
            </div>
            
            <!-- Search Bar -->
            <div class="search-container" style="margin-top: 0; padding-top: 0;">
                <div class="ai-search-container" onclick="app.navigate('browse')">
                    <i class="fas fa-search ai-search-icon" style="color: var(--primary);"></i>
                    <input 
                        type="text" 
                        class="ai-search-input" 
                        placeholder="Search by location, property type, or university..."
                        readonly
                        style="cursor: pointer; background: var(--bg-card); box-shadow: var(--shadow-md); border: none;"
                    >
                </div>
            </div>
            
            <!-- Dynamic Banner -->
            <div class="banner-slider" style="margin-top: 0; padding-top: 0;">
                <div id="dynamicBannerContainer">
                    ${this.renderCurrentBanner()}
                </div>
            </div>
            
            <!-- Popular Universities -->
            <section class="properties-section">
                <div class="section-header">
                    <h2 class="section-title">Popular Universities</h2>
                    <a href="#browse" class="view-all" onclick="app.navigate('browse')">
                        View All <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-md);">
                    ${this.renderUniversityCards()}
                </div>
            </section>
            
            <!-- Featured Properties -->
            <section class="properties-section">
                <div class="section-header">
                    <h2 class="section-title">Featured Listings</h2>
                    <a href="#browse" class="view-all" onclick="app.navigate('browse')">
                        See all <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
                
                <div class="homepage-properties" style="overflow-x: auto; white-space: nowrap; scrollbar-width: none; -ms-overflow-style: none; padding-bottom: var(--space-sm);">
                    ${this.renderHomepageProperties()}
                </div>
            </section>
            
            <!-- Why Primer Section -->
            <section style="padding: var(--space-xl); background: var(--bg-gradient);">
                <h2 style="font-size: var(--font-size-xl); font-weight: 800; margin-bottom: var(--space-xl); text-align: center;">
                    Why choose Primer
                </h2>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-lg);">
                    <div style="text-align: center;">
                        <div style="width: 48px; height: 48px; background: var(--primary-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                            <i class="fas fa-shield-alt" style="color: var(--primary); font-size: 1.2rem;"></i>
                        </div>
                        <h3 style="font-weight: 700; margin-bottom: var(--space-xs);">Verified Properties</h3>
                        <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">All listings verified</p>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 48px; height: 48px; background: var(--primary-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                            <i class="fas fa-bolt" style="color: var(--primary); font-size: 1.2rem;"></i>
                        </div>
                        <h3 style="font-weight: 700; margin-bottom: var(--space-xs);">24/7 Power</h3>
                        <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">Generator backup</p>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 48px; height: 48px; background: var(--primary-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                            <i class="fas fa-home" style="color: var(--primary); font-size: 1.2rem;"></i>
                        </div>
                        <h3 style="font-weight: 700; margin-bottom: var(--space-xs);">All Property Types</h3>
                        <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">Apartments, houses, studios</p>
                    </div>
                    <div style="text-align: center;">
                        <div style="width: 48px; height: 48px; background: var(--primary-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md);">
                            <i class="fas fa-tag" style="color: var(--primary); font-size: 1.2rem;"></i>
                        </div>
                        <h3 style="font-weight: 700; margin-bottom: var(--space-xs);">Best Prices</h3>
                        <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">Negotiated rates</p>
                    </div>
                </div>
            </section>
        `;
    },

    renderCurrentBanner() {
        if (!this.dynamicContent.banners || this.dynamicContent.banners.length === 0) {
            return `
                <div class="banner">
                    <div class="banner-content">
                        <div class="banner-icon">
                            <i class="fas fa-home"></i>
                        </div>
                        <h3 class="banner-title">Find Your Perfect Home</h3>
                        <p class="banner-description">Browse apartments, houses, and student accommodations</p>
                    </div>
                </div>
            `;
        }
        
        const banner = this.dynamicContent.banners[this.currentBannerIndex] || this.dynamicContent.banners[0];
        return `
            <div class="banner" style="animation: fadeIn 0.5s ease;">
                <div class="banner-content">
                    <div class="banner-icon">
                        <i class="fas ${banner.icon || 'fa-home'}"></i>
                    </div>
                    <h3 class="banner-title">${banner.title}</h3>
                    <p class="banner-description">${banner.description}</p>
                </div>
            </div>
        `;
    },

    renderUniversityCards() {
        // Get unique universities from properties
        const universityMap = new Map();
        
        if (Array.isArray(this.properties)) {
            this.properties.forEach(property => {
                if (property.school) {
                    const count = universityMap.get(property.school) || 0;
                    universityMap.set(property.school, count + 1);
                }
            });
        }
        
        // Get top 4 universities
        const topUniversities = Array.from(universityMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name, count]) => ({ name, count }));
        
        // University images
        const uniImages = {
            'Kaduna State University': 'https://images.unsplash.com/photo-1562774053-701939374585?w=500',
            'Gombe State University': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500',
            'Ahmadu Bello University': 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=500',
            'University of Abuja': 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=500'
        };
        
        if (topUniversities.length === 0) {
            // Fallback universities
            return `
                <div style="border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-card); box-shadow: var(--shadow-sm); cursor: pointer;" onclick="app.searchByUniversity('Kaduna State University')">
                    <div style="height: 100px; background-image: url('https://images.unsplash.com/photo-1562774053-701939374585?w=500'); background-size: cover; background-position: center;"></div>
                    <div style="padding: var(--space-md);">
                        <h3 style="font-weight: 700; font-size: var(--font-size-sm); margin-bottom: 4px;">Kaduna State University</h3>
                        <p style="font-size: var(--font-size-xs); color: var(--text-secondary);">2 properties</p>
                    </div>
                </div>
                <div style="border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-card); box-shadow: var(--shadow-sm); cursor: pointer;" onclick="app.searchByUniversity('Gombe State University')">
                    <div style="height: 100px; background-image: url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500'); background-size: cover; background-position: center;"></div>
                    <div style="padding: var(--space-md);">
                        <h3 style="font-weight: 700; font-size: var(--font-size-sm); margin-bottom: 4px;">Gombe State University</h3>
                        <p style="font-size: var(--font-size-xs); color: var(--text-secondary);">1 property</p>
                    </div>
                </div>
            `;
        }
        
        return topUniversities.map(uni => `
            <div style="border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-card); box-shadow: var(--shadow-sm); cursor: pointer;" onclick="app.searchByUniversity('${uni.name.replace(/'/g, "\\'")}')">
                <div style="height: 100px; background-image: url('${uniImages[uni.name] || 'https://images.unsplash.com/photo-1562774053-701939374585?w=500'}'); background-size: cover; background-position: center;"></div>
                <div style="padding: var(--space-md);">
                    <h3 style="font-weight: 700; font-size: var(--font-size-sm); margin-bottom: 4px;">${uni.name}</h3>
                    <p style="font-size: var(--font-size-xs); color: var(--text-secondary);">${uni.count} ${uni.count === 1 ? 'property' : 'properties'}</p>
                </div>
            </div>
        `).join('');
    },

    renderHomepageProperties() {
        if (!Array.isArray(this.properties) || this.properties.length === 0) {
            return '<div style="padding: var(--space-xl); text-align: center;">No properties available</div>';
        }
        
        const featured = this.properties.slice(0, 6);
        
        return featured.map(property => `
            <div class="homepage-property-card" onclick="app.showPropertyDetails('${property.id}')" style="display: inline-block; margin-right: var(--space-lg);">
                ${property.isNew ? `<span class="property-badge new">NEW</span>` : ''}
                ${property.isPopular ? `<span class="property-badge popular">POPULAR</span>` : ''}
                <button class="favorite-btn ${this.isFavorite(property.id) ? 'favorited' : ''}" onclick="event.stopPropagation(); app.toggleFavorite('${property.id}')">
                    <i class="fas fa-heart"></i>
                </button>
                <div class="homepage-property-image-container">
                    <img class="homepage-property-image" src="${property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'}" alt="${property.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'">
                </div>
                <div class="homepage-property-content">
                    <div class="homepage-property-header">
                        <h3 class="homepage-property-title">${property.title}</h3>
                        <span class="homepage-property-price">₦${this.formatNaira(property.price)}</span>
                    </div>
                    <div class="homepage-property-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${property.location || 'Location available'}</span>
                    </div>
                    <div class="homepage-property-features">
                        ${property.features?.map(f => `
                            <span class="homepage-feature">
                                <i class="fas fa-${f.icon}"></i> ${f.label}
                            </span>
                        `).slice(0, 2).join('') || `
                            <span class="homepage-feature">
                                <i class="fas fa-bed"></i> ${property.bedrooms || 1} bed
                            </span>
                        `}
                    </div>
                    <div style="margin-top: var(--space-sm); font-size: var(--font-size-xs); color: var(--text-secondary);">
                        <i class="fas fa-university"></i> ${property.school || 'Near campus'}
                    </div>
                </div>
            </div>
        `).join('');
    },

    // ============================================
    // BROWSE PAGE - MAP DISABLED, COMING SOON ADDED
    // ============================================
    
    renderBrowse() {
        const filteredProperties = this.filterProperties();
        const universityOptions = this.getUniqueUniversities();
        
        return `
            <header class="app-header" style="position: sticky; top: 0; z-index: 30;">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn btn-ghost" onclick="app.navigate('home')">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="header-info">
                            <h1>Browse</h1>
                            <p>${filteredProperties.length} properties found</p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-ghost" onclick="app.showFilterModal()">
                            <i class="fas fa-sliders-h"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Search Bar -->
                <div style="padding: var(--space-md) var(--space-xl) var(--space-xl);">
                    <div class="ai-search-container">
                        <i class="fas fa-search ai-search-icon"></i>
                        <input 
                            type="text" 
                            class="ai-search-input" 
                            id="browseSearchInput"
                            placeholder="Search by university, location..."
                            value="${this.searchQuery || ''}"
                            oninput="app.handleBrowseSearch(this.value)"
                            style="background: var(--bg-secondary);"
                        >
                        ${this.searchQuery ? `
                            <button style="position: absolute; right: var(--space-lg); top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-tertiary); cursor: pointer;" onclick="app.clearSearch()">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                    
                    <!-- Quick Filters -->
                    <div style="display: flex; gap: var(--space-sm); margin-top: var(--space-md); overflow-x: auto; white-space: nowrap; scrollbar-width: none; -ms-overflow-style: none; padding-bottom: var(--space-xs);">
                        <button class="btn ${this.currentFilters.bedrooms === 'any' ? 'btn-outline' : 'btn-primary'}" style="border-radius: 32px;" onclick="app.toggleBedroomFilter()">
                            <i class="fas fa-bed"></i> ${this.currentFilters.bedrooms === 'any' ? 'Any beds' : this.currentFilters.bedrooms}
                        </button>
                        <button class="btn ${this.currentFilters.priceMax === 500000 ? 'btn-outline' : 'btn-primary'}" style="border-radius: 32px;" onclick="app.showPriceFilter()">
                            <i class="fas fa-tag"></i> ${this.getPriceFilterLabel()}
                        </button>
                    </div>
                </div>
            </header>
            
            <!-- University Pills -->
            <div style="padding: var(--space-md) var(--space-xl); overflow-x: auto; white-space: nowrap; scrollbar-width: none; -ms-overflow-style: none; border-bottom: 1px solid var(--border-light);">
                <div style="display: inline-flex; gap: var(--space-sm);">
                    <button class="btn ${!this.currentUniversity ? 'btn-primary' : 'btn-outline'}" style="border-radius: 32px;" onclick="app.clearUniversityFilter()">
                        All Universities
                    </button>
                    ${universityOptions.slice(0, 8).map(uni => `
                        <button class="btn ${this.currentUniversity === uni ? 'btn-primary' : 'btn-outline'}" style="border-radius: 32px;" onclick="app.filterByUniversity('${uni.replace(/'/g, "\\'")}')">
                            ${uni}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <!-- View Toggle - MAP DISABLED, GRID ONLY -->
            <div style="padding: var(--space-md) var(--space-xl); display: flex; justify-content: flex-end; border-bottom: 1px solid var(--border-light);">
                <div style="display: flex; background: var(--bg-secondary); border-radius: var(--radius-full); padding: 2px;">
                    <button class="view-btn active" style="pointer-events: none;">
                        <i class="fas fa-th"></i> Grid
                    </button>
                </div>
            </div>
            
            <!-- MAP COMING SOON - REPLACES MAP VIEW -->
            <div style="height: 280px; width: calc(100% - var(--space-xl) * 2); margin: var(--space-xl); border-radius: var(--radius-lg); background: linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-card) 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; border: 1px dashed var(--border-light);">
                <div style="width: 80px; height: 80px; background: var(--primary-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-lg);">
                    <i class="fas fa-map" style="font-size: 2rem; color: var(--primary);"></i>
                </div>
                <h3 style="font-size: var(--font-size-xl); font-weight: 800; margin-bottom: var(--space-sm); color: var(--text-primary);">Map View Coming Soon</h3>
                <p style="color: var(--text-secondary); max-width: 280px; margin-bottom: var(--space-lg);">We're putting the finishing touches on our interactive map. Check back soon!</p>
                <div style="display: flex; gap: var(--space-sm);">
                    <span style="background: var(--bg-card); padding: 8px 16px; border-radius: var(--radius-full); font-size: var(--font-size-sm); box-shadow: var(--shadow-sm);">
                        <i class="fas fa-check-circle" style="color: var(--success);"></i> ${filteredProperties.length} properties
                    </span>
                    <span style="background: var(--bg-card); padding: 8px 16px; border-radius: var(--radius-full); font-size: var(--font-size-sm); box-shadow: var(--shadow-sm);">
                        <i class="fas fa-university"></i> ${universityOptions.length} campuses
                    </span>
                </div>
            </div>
            
            <!-- Grid View -->
            <div id="propertiesContainer" style="display: block;">
                <div style="padding: var(--space-xl);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-lg);">
                        ${this.renderPropertyCards(filteredProperties)}
                    </div>
                </div>
            </div>
        `;
    },

    renderPropertyCards(properties) {
        if (!Array.isArray(properties) || properties.length === 0) {
            return `
                <div style="grid-column: 1/-1; text-align: center; padding: var(--space-3xl);">
                    <i class="fas fa-home" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: var(--space-lg);"></i>
                    <h3>No properties found</h3>
                    <p style="color: var(--text-secondary); margin-top: var(--space-sm);">Try adjusting your filters</p>
                    <button class="btn btn-primary" style="margin-top: var(--space-lg);" onclick="app.clearAllFilters()">
                        Clear Filters
                    </button>
                </div>
            `;
        }
        
        return properties.map(property => `
            <div class="property-card" onclick="app.showPropertyDetails('${property.id}')">
                <div class="property-image-container">
                    <img class="property-image" src="${property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'}" alt="${property.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'">
                    <button class="favorite-btn ${this.isFavorite(property.id) ? 'favorited' : ''}" onclick="event.stopPropagation(); app.toggleFavorite('${property.id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                    ${property.isNew ? '<span class="property-badge new">NEW</span>' : ''}
                </div>
                <div class="property-content">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-sm);">
                        <h3 class="property-title">${property.title}</h3>
                        <span style="font-weight: 800; color: var(--primary);">₦${this.formatNaira(property.price)}</span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: var(--space-sm); color: var(--text-secondary); font-size: var(--font-size-xs); margin-bottom: var(--space-sm);">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${property.location || 'Location available'}</span>
                    </div>
                    
                    <div style="display: flex; gap: var(--space-md); margin-bottom: var(--space-sm);">
                        ${property.features?.map(f => `
                            <span style="font-size: var(--font-size-xs); color: var(--text-secondary);">
                                <i class="fas fa-${f.icon}" style="color: var(--primary);"></i> ${f.label}
                            </span>
                        `).slice(0, 3).join('') || `
                            <span style="font-size: var(--font-size-xs);"><i class="fas fa-bed"></i> ${property.bedrooms || 1} bed</span>
                        `}
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-sm);">
                        <span style="font-size: var(--font-size-xs); color: var(--text-secondary);">
                            <i class="fas fa-university"></i> ${property.school || 'Near campus'}
                        </span>
                    </div>
                    
                    <button class="btn btn-primary btn-full" style="margin-top: var(--space-md);" onclick="event.stopPropagation(); app.showPropertyDetails('${property.id}')">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    },

    // ============================================
    // FAVORITES PAGE
    // ============================================
    
    renderFavorites() {
        const favoriteProperties = this.properties.filter(p => this.favorites.includes(p.id));
        
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn btn-ghost" onclick="app.navigate('home')">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="header-info">
                            <h1>Favorites</h1>
                            <p>${favoriteProperties.length} saved properties</p>
                        </div>
                    </div>
                </div>
            </header>
            
            <div style="padding: var(--space-xl);">
                ${favoriteProperties.length > 0 ? `
                    <div style="display: grid; gap: var(--space-lg);">
                        ${favoriteProperties.map(property => `
                            <div style="display: flex; gap: var(--space-md); background: var(--bg-card); border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border-light); cursor: pointer;" onclick="app.showPropertyDetails('${property.id}')">
                                <div style="width: 120px; height: 120px; position: relative;">
                                    <img src="${property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500'}" style="width: 100%; height: 100%; object-fit: cover;">
                                    <button class="favorite-btn favorited" style="position: absolute; top: 8px; right: 8px; width: 32px; height: 32px;" onclick="event.stopPropagation(); app.toggleFavorite('${property.id}')">
                                        <i class="fas fa-heart"></i>
                                    </button>
                                </div>
                                <div style="flex: 1; padding: var(--space-md);">
                                    <h3 style="font-weight: 700; margin-bottom: 4px;">${property.title}</h3>
                                    <p style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: var(--space-xs);">
                                        <i class="fas fa-map-marker-alt"></i> ${property.location || 'Location available'}
                                    </p>
                                    <div style="display: flex; gap: var(--space-sm); margin-bottom: var(--space-xs);">
                                        ${property.features?.map(f => `
                                            <span style="font-size: var(--font-size-xs);">
                                                <i class="fas fa-${f.icon}"></i> ${f.label}
                                            </span>
                                        `).slice(0, 2).join('') || `
                                            <span style="font-size: var(--font-size-xs);">
                                                <i class="fas fa-bed"></i> ${property.bedrooms || 1} bed
                                            </span>
                                        `}
                                    </div>
                                    <span style="font-weight: 800; color: var(--primary);">₦${this.formatNaira(property.price)}<span style="font-size: var(--font-size-xs); font-weight: 400; color: var(--text-secondary);">/month</span></span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; padding: var(--space-3xl);">
                        <div style="width: 80px; height: 80px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-lg);">
                            <i class="fas fa-heart" style="font-size: 2rem; color: var(--text-tertiary);"></i>
                        </div>
                        <h3 style="font-weight: 700; margin-bottom: var(--space-sm);">No favorites yet</h3>
                        <p style="color: var(--text-secondary); margin-bottom: var(--space-xl);">Save properties you like to view them later</p>
                        <button class="btn btn-primary" onclick="app.navigate('browse')">
                            Browse Properties
                        </button>
                    </div>
                `}
            </div>
        `;
    },

    // ============================================
    // PROFILE PAGE
    // ============================================
    
    renderProfile() {
        const favoriteCount = this.favorites.length;
        const bookingCount = this.bookings.length;
        
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="header-left">
                        <button class="btn btn-ghost" onclick="app.navigate('home')">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="header-info">
                            <h1>Profile</h1>
                        </div>
                    </div>
                </div>
            </header>
            
            <div style="padding: var(--space-xl);">
                <!-- Profile Header -->
                <div style="display: flex; align-items: center; gap: var(--space-lg); margin-bottom: var(--space-2xl);">
                    <div style="width: 80px; height: 80px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: 700;">
                        ${this.userProfile.avatar ? `<img src="${this.userProfile.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : this.userProfile.name.charAt(0)}
                    </div>
                    <div>
                        <h2 style="font-size: var(--font-size-xl); font-weight: 800; margin-bottom: var(--space-xs);">${this.userProfile.name}</h2>
                        <p style="color: var(--text-secondary); display: flex; align-items: center; gap: var(--space-xs);">
                            <i class="fas fa-user"></i> Member since ${this.userProfile.memberSince}
                        </p>
                    </div>
                </div>
                
                <!-- Stats -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-md); margin-bottom: var(--space-2xl);">
                    <div style="background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius-lg); text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${favoriteCount}</div>
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Favorites</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius-lg); text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${bookingCount}</div>
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Bookings</div>
                    </div>
                    <div style="background: var(--bg-secondary); padding: var(--space-lg); border-radius: var(--radius-lg); text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${this.properties.length}+</div>
                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Properties</div>
                    </div>
                </div>
                
                <!-- Contact Information -->
                <div style="background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-xl); border: 1px solid var(--border-light); margin-bottom: var(--space-xl);">
                    <h3 style="font-weight: 700; margin-bottom: var(--space-lg);">Contact Information</h3>
                    <div style="display: flex; flex-direction: column; gap: var(--space-md);">
                        <div style="display: flex; align-items: center; gap: var(--space-md);">
                            <div style="width: 40px; height: 40px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-phone" style="color: var(--primary);"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Phone</div>
                                <div style="font-weight: 600;">${this.userProfile.phone}</div>
                            </div>
                            <button class="btn btn-ghost" onclick="app.editProfileField('phone')">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                        </div>
                        <div style="display: flex; align-items: center; gap: var(--space-md);">
                            <div style="width: 40px; height: 40px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-envelope" style="color: var(--primary);"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Email</div>
                                <div style="font-weight: 600;">${this.userProfile.email}</div>
                            </div>
                            <button class="btn btn-ghost" onclick="app.editProfileField('email')">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                        </div>
                        <div style="display: flex; align-items: center; gap: var(--space-md);">
                            <div style="width: 40px; height: 40px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-map-marker-alt" style="color: var(--primary);"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Address</div>
                                <div style="font-weight: 600;">${this.userProfile.address || 'Not set'}</div>
                            </div>
                            <button class="btn btn-ghost" onclick="app.editProfileField('address')">
                                <i class="fas fa-pencil-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- ABOUT Primer SECTION -->
                <div style="background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-xl); border: 1px solid var(--border-light); margin-bottom: var(--space-xl);">
                    <h3 style="font-weight: 700; margin-bottom: var(--space-lg);">About Primer</h3>
                    
                    <div style="display: flex; align-items: center; gap: var(--space-lg); margin-bottom: var(--space-xl);">
                        <div style="width: 60px; height: 60px; background: var(--primary); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: 800;">
                            JP
                        </div>
                        <div>
                            <h4 style="font-weight: 700; margin-bottom: 4px;">Primer Housing</h4>
                            <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">Making housing smarter since 2025</p>
                        </div>
                    </div>
                    
                    <div style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: var(--space-lg); margin-bottom: var(--space-xl);">
                        <h4 style="font-weight: 700; margin-bottom: var(--space-md);">Contact Us</h4>
                        <div style="display: flex; flex-direction: column; gap: var(--space-sm);">
                            <div style="display: flex; align-items: center; gap: var(--space-sm);">
                                <i class="fas fa-phone" style="color: var(--primary); width: 20px;"></i>
                                <span style="font-size: var(--font-size-sm);">+234 800 PRIMER</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: var(--space-sm);">
                                <i class="fas fa-envelope" style="color: var(--primary); width: 20px;"></i>
                                <span style="font-size: var(--font-size-sm);">get.primer@proton.me</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: center; gap: var(--space-lg); margin-bottom: var(--space-lg);">
                        <a href="#" class="social-link" style="width: 44px; height: 44px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-primary);">
                            <i class="fab fa-facebook-f"></i>
                        </a>
                        <a href="#" class="social-link" style="width: 44px; height: 44px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-primary);">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="#" class="social-link" style="width: 44px; height: 44px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-primary);">
                            <i class="fab fa-instagram"></i>
                        </a>
                    </div>
                    
                    <div style="text-align: center; font-size: var(--font-size-xs); color: var(--text-tertiary);">
                        © 2025 Primer Technologies. All rights reserved.
                    </div>
                </div>
                
                <!-- Settings -->
                <div style="background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-xl); border: 1px solid var(--border-light); margin-bottom: var(--space-xl);">
                    <h3 style="font-weight: 700; margin-bottom: var(--space-lg);">Settings</h3>
                    
                    <div style="display: flex; flex-direction: column; gap: var(--space-md);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600;">Dark Mode</div>
                                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Switch theme</div>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" ${this.userProfile.preferences.darkMode ? 'checked' : ''} onchange="app.toggleTheme()">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 600;">Notifications</div>
                                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Booking updates</div>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" ${this.userProfile.preferences.notifications ? 'checked' : ''} onchange="app.toggleNotifications(this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                
      
            </div>
        `;
    },

    // ============================================
    // PROPERTY DETAILS
    // ============================================
    
    showPropertyDetails(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;
        
        this.currentProperty = property;
        this.currentGalleryIndex = 0;
        this.currentGalleryImages = property.images || [];
        
        const modal = document.getElementById('bottomModal');
        
        modal.innerHTML = `
            <div style="height: 100%; overflow-y: auto; background: var(--bg-card);">
                <!-- Gallery Header -->
                <div style="position: relative; height: 300px; background: var(--bg-tertiary);">
                    <img src="${this.currentGalleryImages[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'}" 
                         style="width: 100%; height: 100%; object-fit: cover;" 
                         id="detailGalleryImage"
                         onerror="this.src='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'">
                    
                    ${this.currentGalleryImages.length > 1 ? `
                        <button style="position: absolute; left: var(--space-md); top: 50%; transform: translateY(-50%); width: 44px; height: 44px; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; box-shadow: var(--shadow-lg); cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;" onclick="event.stopPropagation(); app.navigateDetailGallery(-1)">
                            <i class="fas fa-chevron-left" style="color: var(--text-primary);"></i>
                        </button>
                        <button style="position: absolute; right: var(--space-md); top: 50%; transform: translateY(-50%); width: 44px; height: 44px; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; box-shadow: var(--shadow-lg); cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;" onclick="event.stopPropagation(); app.navigateDetailGallery(1)">
                            <i class="fas fa-chevron-right" style="color: var(--text-primary);"></i>
                        </button>
                        <div style="position: absolute; bottom: var(--space-md); left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 6px 16px; border-radius: var(--radius-full); font-size: var(--font-size-xs);">
                            ${this.currentGalleryIndex + 1} / ${this.currentGalleryImages.length}
                        </div>
                    ` : ''}
                    
                    <button style="position: absolute; top: var(--space-lg); right: var(--space-lg); width: 44px; height: 44px; background: white; border: none; border-radius: 50%; box-shadow: var(--shadow-lg); cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;" onclick="app.closeModal()">
                        <i class="fas fa-times" style="color: var(--text-primary); font-size: 1.2rem;"></i>
                    </button>
                    
                    <button style="position: absolute; top: var(--space-lg); left: var(--space-lg); width: 44px; height: 44px; background: white; border: none; border-radius: 50%; box-shadow: var(--shadow-lg); cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;" onclick="event.stopPropagation(); app.toggleFavorite('${property.id}')">
                        <i class="fas fa-heart" style="color: ${this.isFavorite(property.id) ? 'var(--danger)' : 'var(--text-secondary)'}; font-size: 1.2rem;"></i>
                    </button>
                </div>
                
                <!-- Content -->
                <div style="padding: var(--space-xl);">
                    <!-- Title & Price -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-lg);">
                        <div>
                            <h2 style="font-size: 1.5rem; font-weight: 800; margin-bottom: var(--space-xs);">${property.title}</h2>
                            <div style="display: flex; align-items: center; gap: var(--space-sm); color: var(--text-secondary);">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${property.location || 'Location available'}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 1.8rem; font-weight: 800; color: var(--primary);">₦${this.formatNaira(property.price)}</span>
                            <span style="display: block; font-size: var(--font-size-sm); color: var(--text-secondary);">per month</span>
                        </div>
                    </div>
                    
                    <!-- Landlord Info -->
                    <div style="display: flex; align-items: center; gap: var(--space-md); padding: var(--space-lg); background: var(--bg-secondary); border-radius: var(--radius-lg); margin-bottom: var(--space-xl);">
                        <div style="width: 48px; height: 48px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.2rem;">
                            ${property.landlord?.name?.charAt(0) || 'L'}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 700;">${property.landlord?.name || 'Property Manager'}</div>
                            <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${property.landlord?.phone || '+234 800 123 4567'}</div>
                        </div>
                        <button class="btn btn-primary" onclick="event.stopPropagation(); app.callLandlord('${property.id}')" style="background: var(--primary);">
                            <i class="fas fa-phone"></i> Call
                        </button>
                    </div>
                    
                    <!-- Features -->
                    <h3 style="font-weight: 700; margin-bottom: var(--space-lg);">What this place offers</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-lg); margin-bottom: var(--space-xl);">
                        ${property.features?.map(f => `
                            <div style="display: flex; align-items: center; gap: var(--space-md);">
                                <div style="width: 40px; height: 40px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-${f.icon}" style="color: var(--primary);"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 600;">${f.label}</div>
                                </div>
                            </div>
                        `).slice(0, 4).join('') || `
                            <div style="display: flex; align-items: center; gap: var(--space-md);">
                                <div style="width: 40px; height: 40px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-bed"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 600;">${property.bedrooms || 1} Bedroom</div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: var(--space-md);">
                                <div style="width: 40px; height: 40px; background: var(--bg-secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-bath"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 600;">${property.bathrooms || 1} Bathroom</div>
                                </div>
                            </div>
                        `}
                    </div>
                    
                    <!-- Description -->
                    <h3 style="font-weight: 700; margin-bottom: var(--space-lg);">About this property</h3>
                    <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: var(--space-xl);">
                        ${property.description || 'Beautiful property in a great location. Close to public transportation, shopping, and dining.'}
                    </p>
                    
                    <!-- Amenities -->
                    <h3 style="font-weight: 700; margin-bottom: var(--space-lg);">Amenities</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: var(--space-sm); margin-bottom: var(--space-xl);">
                        ${property.amenities?.map(amenity => `
                            <span style="background: var(--bg-secondary); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-full); font-size: var(--font-size-sm);">
                                <i class="fas fa-check-circle" style="color: var(--success); margin-right: var(--space-xs);"></i>
                                ${amenity}
                            </span>
                        `).join('') || `
                            <span style="background: var(--bg-secondary); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-full);">
                                <i class="fas fa-bolt"></i> 24/7 Electricity
                            </span>
                            <span style="background: var(--bg-secondary); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-full);">
                                <i class="fas fa-shield-alt"></i> Security
                            </span>
                        `}
                    </div>
                    
                    <!-- Location -->
                    <h3 style="font-weight: 700; margin-bottom: var(--space-lg);">Location</h3>
                    <div style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: var(--space-lg); margin-bottom: var(--space-xl);">
                        <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-md);">
                            <i class="fas fa-university" style="color: var(--primary);"></i>
                            <div>
                                <div style="font-weight: 600;">${property.school || 'Near area'}</div>
                                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${property.distance || 'Convenient location'}</div>
                            </div>
                        </div>
                        <button class="btn btn-outline btn-full" onclick="app.viewOnMap('${property.id}')">
                            <i class="fas fa-map"></i> View on Map
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.openModal();
    },

    // ============================================
    // GALLERY NAVIGATION
    // ============================================
    
    navigateDetailGallery(direction) {
        if (!this.currentGalleryImages || this.currentGalleryImages.length === 0) return;
        
        this.currentGalleryIndex += direction;
        
        if (this.currentGalleryIndex < 0) {
            this.currentGalleryIndex = this.currentGalleryImages.length - 1;
        } else if (this.currentGalleryIndex >= this.currentGalleryImages.length) {
            this.currentGalleryIndex = 0;
        }
        
        const galleryImage = document.getElementById('detailGalleryImage');
        if (galleryImage) {
            galleryImage.src = this.currentGalleryImages[this.currentGalleryIndex];
            galleryImage.onerror = function() {
                this.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
            };
        }
        
        // Update counter
        const counter = document.querySelector('.gallery-counter');
        if (counter) {
            counter.textContent = `${this.currentGalleryIndex + 1} / ${this.currentGalleryImages.length}`;
        }
    },

    // ============================================
    // VIEW ON MAP - DISABLED
    // ============================================
    
    viewOnMap(propertyId) {
        this.closeModal();
        this.showToast('🗺️ Map view is coming soon!', 'info');
        this.navigate('browse');
    },

    // ============================================
    // SET VIEW - DISABLED
    // ============================================
    
    setView(view) {
        if (view === 'map') {
            this.showToast('🗺️ Map view is coming soon!', 'info');
            return;
        }
        this.currentView = 'grid';
        this.render();
    },

    // ============================================
    // LANDLORD CALL
    // ============================================
    
    callLandlord(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        const phone = property?.landlord?.phone || '+234 800 123 4567';
        this.showToast(`Calling ${property?.landlord?.name || 'Landlord'} at ${phone}...`, 'info');
    },

    // ============================================
    // COMPANY CALL BUTTON
    // ============================================
    
    callCompany() {
        this.showToast('Calling Primer Support: +234 800 PRIMER', 'info');
    },

    // ============================================
    // USER BOOKINGS
    // ============================================
    
    renderUserBookings() {
        if (!Array.isArray(this.bookings) || this.bookings.length === 0) {
            return `
                <div style="text-align: center; padding: var(--space-2xl); background: var(--bg-secondary); border-radius: var(--radius-lg);">
                    <i class="fas fa-calendar-check" style="font-size: 2rem; color: var(--text-tertiary); margin-bottom: var(--space-md);"></i>
                    <p style="color: var(--text-secondary);">No bookings yet</p>
                </div>
            `;
        }
        
        return this.bookings.slice(0, 3).map(booking => `
            <div style="background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-lg); border: 1px solid var(--border-light); margin-bottom: var(--space-md);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-sm);">
                    <div>
                        <span style="font-weight: 700;">${booking.service}</span>
                        <span style="font-size: var(--font-size-xs); color: var(--text-secondary); display: block;">${booking.package || ''}</span>
                    </div>
                    <span style="background: var(--primary-100); color: var(--primary); padding: 4px 8px; border-radius: var(--radius-full); font-size: var(--font-size-xs); text-transform: uppercase;">
                        ${booking.status}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: var(--font-size-xs); color: var(--text-secondary);">ID: ${booking.id}</span>
                    <span style="font-weight: 700; color: var(--primary);">₦${this.formatNaira(booking.total || 1500)}</span>
                </div>
            </div>
        `).join('');
    },

    // ============================================
    // FILTER PROPERTIES
    // ============================================
    
    filterProperties() {
        if (!Array.isArray(this.properties)) return [];
        
        return this.properties.filter(property => {
            // Price filter
            if (this.currentFilters.priceMax < 500000 && property.price > this.currentFilters.priceMax) return false;
            
            // Bedrooms filter
            if (this.currentFilters.bedrooms !== 'any') {
                const bedCount = this.extractBedroomCount(property);
                if (this.currentFilters.bedrooms === '3') {
                    if (bedCount < 3) return false;
                } else {
                    const filterBed = parseInt(this.currentFilters.bedrooms) || 0;
                    if (bedCount !== filterBed) return false;
                }
            }
            
            // University filter
            if (this.currentUniversity && property.school !== this.currentUniversity) {
                return false;
            }
            
            // Search query
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                const matches = 
                    (property.title?.toLowerCase().includes(query)) ||
                    (property.location?.toLowerCase().includes(query)) ||
                    (property.school?.toLowerCase().includes(query));
                if (!matches) return false;
            }
            
            return true;
        });
    },

    extractBedroomCount(property) {
        if (property.bedrooms) return property.bedrooms;
        
        const bedFeature = property.features?.find(f => f.icon === 'bed');
        if (bedFeature) {
            const match = bedFeature.label.match(/(\d+)/);
            return match ? parseInt(match[0]) : 1;
        }
        
        return 1;
    },

    // ============================================
    // UTILITY METHODS
    // ============================================
    
    formatNaira(amount) {
        if (!amount) return '0';
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    isFavorite(propertyId) {
        return this.favorites.includes(propertyId);
    },

    toggleFavorite(propertyId) {
        if (this.isFavorite(propertyId)) {
            this.favorites = this.favorites.filter(id => id !== propertyId);
            this.showToast('Removed from favorites', 'info');
        } else {
            this.favorites.push(propertyId);
            this.showToast('Added to favorites', 'success');
        }
        
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        
        // Update UI
        const favBtns = document.querySelectorAll(`.favorite-btn[onclick*="${propertyId}"]`);
        favBtns.forEach(btn => {
            btn.classList.toggle('favorited');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.style.color = btn.classList.contains('favorited') ? 'var(--danger)' : 'var(--text-secondary)';
            }
        });
        
        if (this.currentPage === 'favorites') {
            this.render();
        }
    },

    getUniqueUniversities() {
        const unis = this.properties.map(p => p.school).filter(Boolean);
        return [...new Set(unis)];
    },

    handleBrowseSearch(value) {
        this.searchQuery = value;
        this.render();
    },

    clearSearch() {
        this.searchQuery = '';
        this.render();
    },

    filterByUniversity(uni) {
        this.currentUniversity = this.currentUniversity === uni ? null : uni;
        this.render();
    },

    clearUniversityFilter() {
        this.currentUniversity = null;
        this.render();
    },

    toggleBedroomFilter() {
        const options = ['any', '1', '2', '3'];
        const currentIndex = options.indexOf(this.currentFilters.bedrooms);
        const nextIndex = (currentIndex + 1) % options.length;
        this.currentFilters.bedrooms = options[nextIndex];
        this.render();
    },

    getPriceFilterLabel() {
        if (this.currentFilters.priceMax === 500000) return 'Any price';
        if (this.currentFilters.priceMax === 50000) return 'Under ₦50k';
        if (this.currentFilters.priceMax === 100000) return 'Under ₦100k';
        if (this.currentFilters.priceMax === 150000) return 'Under ₦150k';
        if (this.currentFilters.priceMax === 200000) return 'Under ₦200k';
        return `Under ₦${this.formatNaira(this.currentFilters.priceMax)}`;
    },

    showPriceFilter() {
        const modal = document.getElementById('bottomModal');
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">Maximum Price</h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div style="padding: var(--space-xl);">
                <div style="display: grid; gap: var(--space-sm);">
                    <button class="btn ${this.currentFilters.priceMax === 500000 ? 'btn-primary' : 'btn-outline'} btn-full" onclick="app.setMaxPrice(500000); app.closeModal();">
                        Any price
                    </button>
                    <button class="btn ${this.currentFilters.priceMax === 50000 ? 'btn-primary' : 'btn-outline'} btn-full" onclick="app.setMaxPrice(50000); app.closeModal();">
                        Under ₦50,000
                    </button>
                    <button class="btn ${this.currentFilters.priceMax === 100000 ? 'btn-primary' : 'btn-outline'} btn-full" onclick="app.setMaxPrice(100000); app.closeModal();">
                        Under ₦100,000
                    </button>
                    <button class="btn ${this.currentFilters.priceMax === 150000 ? 'btn-primary' : 'btn-outline'} btn-full" onclick="app.setMaxPrice(150000); app.closeModal();">
                        Under ₦150,000
                    </button>
                    <button class="btn ${this.currentFilters.priceMax === 200000 ? 'btn-primary' : 'btn-outline'} btn-full" onclick="app.setMaxPrice(200000); app.closeModal();">
                        Under ₦200,000
                    </button>
                </div>
            </div>
        `;
        
        this.openModal();
    },

    setMaxPrice(price) {
        this.currentFilters.priceMax = price;
        this.render();
    },

    clearAllFilters() {
        this.currentFilters = {
            priceMin: 0,
            priceMax: 500000,
            bedrooms: 'any',
            bathrooms: 'any',
            propertyType: 'any'
        };
        this.searchQuery = '';
        this.currentUniversity = null;
        this.render();
    },

    showFilterModal() {
        const modal = document.getElementById('bottomModal');
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">Filters</h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div style="padding: var(--space-xl);">
                <div class="form-group">
                    <label class="form-label">Price Range</label>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-md);">
                        <button class="btn ${this.currentFilters.priceMax === 50000 ? 'btn-primary' : 'btn-outline'}" onclick="app.setMaxPrice(50000); app.closeModal();">Under ₦50k</button>
                        <button class="btn ${this.currentFilters.priceMax === 100000 ? 'btn-primary' : 'btn-outline'}" onclick="app.setMaxPrice(100000); app.closeModal();">Under ₦100k</button>
                        <button class="btn ${this.currentFilters.priceMax === 150000 ? 'btn-primary' : 'btn-outline'}" onclick="app.setMaxPrice(150000); app.closeModal();">Under ₦150k</button>
                        <button class="btn ${this.currentFilters.priceMax === 200000 ? 'btn-primary' : 'btn-outline'}" onclick="app.setMaxPrice(200000); app.closeModal();">Under ₦200k</button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Bedrooms</label>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-sm);">
                        <button class="btn ${this.currentFilters.bedrooms === 'any' ? 'btn-primary' : 'btn-outline'}" onclick="app.setBedroomFilter('any'); app.closeModal();">Any</button>
                        <button class="btn ${this.currentFilters.bedrooms === '1' ? 'btn-primary' : 'btn-outline'}" onclick="app.setBedroomFilter('1'); app.closeModal();">1</button>
                        <button class="btn ${this.currentFilters.bedrooms === '2' ? 'btn-primary' : 'btn-outline'}" onclick="app.setBedroomFilter('2'); app.closeModal();">2</button>
                        <button class="btn ${this.currentFilters.bedrooms === '3' ? 'btn-primary' : 'btn-outline'}" onclick="app.setBedroomFilter('3'); app.closeModal();">3+</button>
                    </div>
                </div>
                
                <button class="btn btn-outline btn-full" onclick="app.clearAllFilters(); app.closeModal();">
                    Clear All Filters
                </button>
            </div>
        `;
        
        this.openModal();
    },

    setBedroomFilter(value) {
        this.currentFilters.bedrooms = value;
        this.render();
    },

    // ============================================
    // PROFILE MANAGEMENT
    // ============================================
    
    editProfileField(field) {
        const modal = document.getElementById('bottomModal');
        
        let title, inputType, currentValue;
        
        switch(field) {
            case 'phone':
                title = 'Edit Phone Number';
                inputType = 'tel';
                currentValue = this.userProfile.phone;
                break;
            case 'email':
                title = 'Edit Email';
                inputType = 'email';
                currentValue = this.userProfile.email;
                break;
            case 'address':
                title = 'Edit Address';
                inputType = 'text';
                currentValue = this.userProfile.address || '';
                break;
            default:
                title = 'Edit Profile';
                inputType = 'text';
                currentValue = this.userProfile.name;
        }
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" onclick="app.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div style="padding: var(--space-xl);">
                <div class="form-group">
                    <input type="${inputType}" class="form-input" id="editFieldValue" value="${currentValue}" placeholder="Enter new value">
                </div>
                <div style="display: flex; gap: var(--space-md);">
                    <button class="btn btn-primary btn-full" onclick="app.saveProfileField('${field}')">
                        Save Changes
                    </button>
                    <button class="btn btn-outline btn-full" onclick="app.closeModal()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        this.openModal();
        this.currentEditField = field;
    },

    saveProfileField(field) {
        const newValue = document.getElementById('editFieldValue')?.value;
        if (!newValue) return;
        
        if (field === 'phone') {
            this.userProfile.phone = newValue;
        } else if (field === 'email') {
            this.userProfile.email = newValue;
        } else if (field === 'address') {
            this.userProfile.address = newValue;
        }
        
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
        this.closeModal();
        this.render();
        this.showToast('Profile updated', 'success');
    },

    toggleNotifications(enabled) {
        this.userProfile.preferences.notifications = enabled;
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
        this.showToast(`Notifications ${enabled ? 'enabled' : 'disabled'}`, 'info');
    },

    logout() {
        this.userProfile = {
            name: 'Guest User',
            email: 'guest@email.com',
            phone: '+234 800 000 0000',
            avatar: null,
            address: '',
            memberSince: '2025',
            preferences: {
                notifications: true,
                darkMode: this.userProfile.preferences.darkMode
            }
        };
        
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
        this.navigate('home');
        this.showToast('Logged out successfully', 'info');
    },

    // ============================================
    // MODAL MANAGEMENT
    // ============================================
    
    openModal() {
        const backdrop = document.getElementById('modalBackdrop');
        const modal = document.getElementById('bottomModal');
        if (backdrop) backdrop.classList.add('active');
        if (modal) {
            modal.classList.add('active');
            modal.style.height = '90vh';
            modal.style.overflowY = 'auto';
        }
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        const backdrop = document.getElementById('modalBackdrop');
        const modal = document.getElementById('bottomModal');
        if (backdrop) backdrop.classList.remove('active');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentProperty = null;
    },

    closeGallery() {
        const galleryModal = document.getElementById('galleryModal');
        if (galleryModal) {
            galleryModal.classList.remove('active');
        }
    },

    closeEditProfile() {
        const editModal = document.getElementById('editProfileModal');
        if (editModal) {
            editModal.classList.add('hidden');
        }
    },

    // ============================================
    // NAVIGATION
    // ============================================
    
    navigate(page) {
        this.currentPage = page;
        window.location.hash = page;
        this.render();
        this.closeModal();
    },

    updateActiveNav() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === `#${this.currentPage}`) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    // ============================================
    // THEME
    // ============================================
    
    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        this.userProfile.preferences.darkMode = newTheme === 'dark';
        
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            themeIcon.className = `fas ${newTheme === 'dark' ? 'fa-sun' : 'fa-moon'}`;
        }
    },

    applyTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    },

    // ============================================
    // BANNER ROTATION
    // ============================================
    
    startBannerRotation() {
        if (this.bannerInterval) clearInterval(this.bannerInterval);
        this.bannerInterval = setInterval(() => {
            this.rotateBanner();
        }, 5000);
    },

    rotateBanner() {
        if (!this.dynamicContent.banners || this.dynamicContent.banners.length === 0) return;
        
        this.currentBannerIndex = (this.currentBannerIndex + 1) % this.dynamicContent.banners.length;
        
        const bannerContainer = document.getElementById('dynamicBannerContainer');
        if (bannerContainer) {
            const banner = this.dynamicContent.banners[this.currentBannerIndex];
            bannerContainer.innerHTML = `
                <div class="banner" style="animation: fadeIn 0.5s ease;">
                    <div class="banner-content">
                        <div class="banner-icon">
                            <i class="fas ${banner.icon || 'fa-home'}"></i>
                        </div>
                        <h3 class="banner-title">${banner.title}</h3>
                        <p class="banner-description">${banner.description}</p>
                    </div>
                </div>
            `;
        }
    },

    // ============================================
    // SEARCH
    // ============================================
    
    searchByUniversity(uniName) {
        this.currentUniversity = uniName;
        this.navigate('browse');
    },

    // ============================================
    // TOAST NOTIFICATIONS
    // ============================================
    
    showToast(message, type = 'info') {
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-info-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span style="flex: 1;">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
                if (toastContainer.children.length === 0) {
                    toastContainer.remove();
                }
            }, 300);
        }, 3000);
    },

    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    setupEventListeners() {
        // Close modal when clicking backdrop
        const backdrop = document.getElementById('modalBackdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        // Handle back button
        window.addEventListener('popstate', () => {
            const hash = window.location.hash || '#home';
            this.navigate(hash.replace('#', ''));
        });
        
        // Floating call button - COMPANY CALL
        const callBtn = document.getElementById('floatingCallBtn');
        if (callBtn) {
            callBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.callCompany();
            });
        }
        
        // Show/hide floating call button based on map view - DISABLED
        document.addEventListener('scroll', () => {
            const callBtn = document.getElementById('floatingCallBtn');
            if (callBtn) {
                // Always hide since map is disabled
                callBtn.classList.add('hidden');
            }
        });
    },

    callPrimer() {
        this.callCompany();
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = app;
    app.init();
});