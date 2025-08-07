document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const filtersContainer = document.getElementById('filters-container');
    const sidebar = document.getElementById('sidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    const floatingToggle = document.getElementById('floatingToggle');
    const mainContent = document.getElementById('main-content');
    const resultCount = document.getElementById('result-count');
    const projectCountBadge = document.getElementById('project-count-badge');

    let allProjects = [];
    let activeFilters = {};
    let currentFilteredProjects = [];

    // Check URL for a flag to show hidden projects
    const urlParams = new URLSearchParams(window.location.search);
    const showHidden = urlParams.get('show') === 'hidden';

    // Sidebar toggle functionality
    function toggleSidebar() {
        sidebar.classList.toggle('sidebar-collapsed');
        
        // Update hamburger icon
        const icon = toggleSidebarBtn.querySelector('i');
        icon.className = sidebar.classList.contains('sidebar-collapsed') ? 'bi bi-list' : 'bi bi-x-lg';
        
        // Show/hide floating button
        floatingToggle.style.display = sidebar.classList.contains('sidebar-collapsed') ? 'flex' : 'none';
    }

    toggleSidebarBtn.addEventListener('click', toggleSidebar);
    floatingToggle.addEventListener('click', toggleSidebar);

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('sidebar-collapsed');
        const icon = toggleSidebarBtn.querySelector('i');
        icon.className = 'bi bi-list';
        floatingToggle.style.display = 'flex';
    });

    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 768 && 
            !sidebar.contains(e.target) && 
            !toggleSidebarBtn.contains(e.target) && 
            !floatingToggle.contains(e.target) &&
            !sidebar.classList.contains('sidebar-collapsed')) {
            sidebar.classList.add('sidebar-collapsed');
            const icon = toggleSidebarBtn.querySelector('i');
            icon.className = 'bi bi-list';
            floatingToggle.style.display = 'flex';
        }
    });

    // Initialize sidebar state
    if (window.innerWidth < 768) {
        sidebar.classList.add('sidebar-collapsed');
        floatingToggle.style.display = 'flex';
    }

    // --- Data Fetching and Initialization ---
    fetch('projects.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allProjects = data;
            initializePage();
        })
        .catch(error => {
            console.error('Could not load or parse projects.json:', error);
            projectsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger" role="alert"><strong>Error:</strong> Could not load project data. Please ensure 'projects.json' exists and is valid.</div></div>`;
        });

    function initializePage() {
        const projectsToDisplay = showHidden ? allProjects : allProjects.filter(p => p.status !== 'hidden');
        
        const allTags = extractTags(projectsToDisplay);
        createFilterUI(allTags);
        
        // Load saved filter preferences or default to all checked
        loadFilterPreferences();
        
        // Don't render projects here - loadFilterPreferences() now calls applyFilters()
    }

    // --- UI Generation ---
    function extractTags(projects) {
        const tags = {};
        projects.forEach(project => {
            for (const category in project.tags) {
                if (!tags[category]) {
                    tags[category] = new Set();
                }
                project.tags[category].forEach(tag => tags[category].add(tag));
            }
        });
        return tags;
    }

    function createFilterUI(allTags) {
        // Clear previous filters but keep the title
        while (filtersContainer.childElementCount > 1) {
            filtersContainer.removeChild(filtersContainer.lastChild);
        }

        // Create accordion container
        const accordionContainer = document.createElement('div');
        accordionContainer.className = 'col-12';
        accordionContainer.innerHTML = '<div class="accordion" id="filtersAccordion"></div>';
        filtersContainer.appendChild(accordionContainer);
        
        const accordion = accordionContainer.querySelector('.accordion');

        Object.keys(allTags).forEach((category, index) => {
            const friendlyCat = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const categoryId = `filter-${category}`;
            const tags = Array.from(allTags[category]).sort();

            const checkboxes = tags.map(tag => {
                const sanitizedTag = tag.replace(/[^a-zA-Z0-9]/g, '-');
                return `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="${tag}" 
                               id="${categoryId}-${sanitizedTag}" data-category="${category}">
                        <label class="form-check-label" for="${categoryId}-${sanitizedTag}">
                            ${tag}
                        </label>
                    </div>
                `;
            }).join('');

            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';
            accordionItem.innerHTML = `
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                            data-bs-target="#collapse-${category}" aria-expanded="false" 
                            aria-controls="collapse-${category}">
                        <i class="bi bi-funnel me-2"></i>${friendlyCat}
                        <span class="badge bg-secondary ms-auto me-3" id="badge-${category}">0</span>
                    </button>
                </h2>
                <div id="collapse-${category}" class="accordion-collapse collapse" 
                     data-bs-parent="#filtersAccordion">
                    <div class="accordion-body">
                        <div class="mb-2">
                            <button type="button" class="btn btn-sm btn-outline-primary me-2 select-all-btn" 
                                    data-category="${category}">Select All</button>
                            <button type="button" class="btn btn-sm btn-outline-secondary select-none-btn" 
                                    data-category="${category}">Clear All</button>
                        </div>
                        <div class="row">
                            <div class="col-12">
                                ${checkboxes}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            accordion.appendChild(accordionItem);
        });

        // Add event listeners to checkboxes
        filtersContainer.querySelectorAll('.form-check-input').forEach(checkbox => {
            checkbox.addEventListener('change', handleCheckboxChange);
        });

        // Add select all/none functionality
        filtersContainer.querySelectorAll('.select-all-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                const checkboxes = filtersContainer.querySelectorAll(`input[data-category="${category}"]`);
                checkboxes.forEach(cb => cb.checked = true);
                updateActiveFilters();
                applyFilters();
            });
        });

        filtersContainer.querySelectorAll('.select-none-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                const checkboxes = filtersContainer.querySelectorAll(`input[data-category="${category}"]`);
                checkboxes.forEach(cb => cb.checked = false);
                updateActiveFilters();
                applyFilters();
            });
        });
    }

    function renderProjects(projects) {
        currentFilteredProjects = projects;
        projectsContainer.innerHTML = '';
        
        // Update counts
        const totalProjects = showHidden ? allProjects.length : allProjects.filter(p => p.status !== 'hidden').length;
        resultCount.textContent = `Showing ${projects.length} of ${totalProjects} projects`;
        projectCountBadge.textContent = `${projects.length} projects`;
        
        if (projects.length === 0) {
            projectsContainer.innerHTML = `<div class="col-12"><p class="text-muted text-center lead mt-5">No projects match the selected filters.</p></div>`;
            return;
        }
        
        projects.forEach(project => {
            const card = document.createElement('div');
            // Use simple class since we're using CSS Grid instead of Bootstrap columns
            card.className = 'project-card';
            if (project.status === 'hidden') {
                card.dataset.status = 'hidden';
            }

            // Generate activity badges
            const activityBadges = generateActivityBadges(project.activity || {});
            
            // Format last activity
            const lastActivity = formatLastActivity(project.activity);

            card.innerHTML = `
                <div class="card h-100 shadow-sm position-relative">
                    ${activityBadges}
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title"><i class="bi ${project.icon || 'bi-box-seam'} me-2"></i>${project.title}</h5>
                        <p class="card-text text-body-secondary">${project.description}</p>
                        ${lastActivity}
                        <div class="mt-auto pt-3">
                           <a href="${project.url}" class="btn btn-primary w-100" target="_blank" rel="noopener noreferrer">Go to Project</a>
                        </div>
                    </div>
                </div>
            `;
            projectsContainer.appendChild(card);
        });
    }

    // --- Activity Badge Generation ---
    function generateActivityBadges(activity) {
        if (!activity || !activity.hotness_score) return '';
        
        const hotness = activity.hotness_score;
        const commits = activity.commits_30d || 0;
        const contributors = activity.contributors || 0;
        
        let badges = [];
        
        // Hotness badge
        if (hotness >= 80) {
            badges.push('<span class="badge bg-danger position-absolute top-0 end-0 m-2 hotness-badge" title="Very Active Project">🔥 Hot</span>');
        } else if (hotness >= 60) {
            badges.push('<span class="badge bg-warning position-absolute top-0 end-0 m-2 hotness-badge" title="Active Project">⚡ Active</span>');
        } else if (hotness >= 40) {
            badges.push('<span class="badge bg-success position-absolute top-0 end-0 m-2 hotness-badge" title="Regularly Updated">📈 Growing</span>');
        } else if (hotness >= 20) {
            badges.push('<span class="badge bg-info position-absolute top-0 end-0 m-2 hotness-badge" title="Some Recent Activity">🆕 Updated</span>');
        } else if (hotness > 0) {
            badges.push('<span class="badge bg-secondary position-absolute top-0 end-0 m-2 hotness-badge" title="Low Activity">💤 Quiet</span>');
        }
        
        return badges.join('');
    }
    
    function formatLastActivity(activity) {
        if (!activity) return '';
        
        const commits = activity.commits_30d || 0;
        const contributors = activity.contributors || 0;
        const lastCommit = activity.last_commit;
        
        let activityText = [];
        
        if (commits > 0) {
            activityText.push(`${commits} commits (30d)`);
        }
        
        if (contributors > 1) {
            activityText.push(`${contributors} contributors`);
        }
        
        if (lastCommit && lastCommit !== 'unknown') {
            const daysSince = Math.floor((new Date() - new Date(lastCommit)) / (1000 * 60 * 60 * 24));
            if (daysSince === 0) {
                activityText.push('Updated today');
            } else if (daysSince === 1) {
                activityText.push('Updated yesterday');
            } else if (daysSince < 30) {
                activityText.push(`Updated ${daysSince} days ago`);
            }
        }
        
        if (activityText.length > 0) {
            return `<div class="activity-info text-muted small mb-2"><i class="bi bi-activity me-1"></i>${activityText.join(' • ')}</div>`;
        }
        
        return '';
    }

    // --- Filtering Logic ---
    function handleCheckboxChange(e) {
        updateActiveFilters();
        applyFilters();
    }

    function updateActiveFilters() {
        activeFilters = {};
        
        // Group checked checkboxes by category
        const categories = [...new Set(Array.from(filtersContainer.querySelectorAll('.form-check-input')).map(cb => cb.dataset.category))];
        
        categories.forEach(category => {
            const allBoxes = filtersContainer.querySelectorAll(`input[data-category="${category}"]`);
            const checkedBoxes = filtersContainer.querySelectorAll(`input[data-category="${category}"]:checked`);
            const values = Array.from(checkedBoxes).map(cb => cb.value);
            
            // If all are checked, don't filter (show everything for this category)
            // If none are checked, filter to show nothing for this category
            // If some are checked, filter to show only those
            if (values.length > 0 && values.length < allBoxes.length) {
                // Some checked - filter to show only selected values
                activeFilters[category] = values;
            } else if (values.length === 0) {
                // None checked - filter to show nothing (empty array means no matches)
                activeFilters[category] = [];
            }
            // If values.length === allBoxes.length (all checked), don't add to activeFilters (show all)
            
            // Update badge count
            const badge = document.getElementById(`badge-${category}`);
            if (badge) {
                badge.textContent = values.length;
                badge.className = values.length > 0 ? 'badge bg-primary ms-auto me-3' : 'badge bg-secondary ms-auto me-3';
            }
        });
        
        // Save current filter state
        saveFilterPreferences();
    }
    
    function loadFilterPreferences() {
        try {
            const saved = localStorage.getItem('dcri-hub-filters');
            if (saved) {
                const preferences = JSON.parse(saved);
                
                // Apply saved preferences
                Object.keys(preferences).forEach(category => {
                    const values = preferences[category];
                    values.forEach(value => {
                        const checkbox = filtersContainer.querySelector(`input[data-category="${category}"][value="${value}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                });
            } else {
                // Default: check all boxes
                filtersContainer.querySelectorAll('.form-check-input').forEach(cb => cb.checked = true);
            }
        } catch (e) {
            // Default: check all boxes
            filtersContainer.querySelectorAll('.form-check-input').forEach(cb => cb.checked = true);
        }
        
        updateActiveFilters();
        applyFilters();
    }
    
    function saveFilterPreferences() {
        try {
            const preferences = {};
            const categories = [...new Set(Array.from(filtersContainer.querySelectorAll('.form-check-input')).map(cb => cb.dataset.category))];
            
            categories.forEach(category => {
                const checkedBoxes = filtersContainer.querySelectorAll(`input[data-category="${category}"]:checked`);
                preferences[category] = Array.from(checkedBoxes).map(cb => cb.value);
            });
            
            localStorage.setItem('dcri-hub-filters', JSON.stringify(preferences));
        } catch (e) {
            // Ignore localStorage errors
            console.warn('Could not save filter preferences:', e);
        }
    }
    
    function applyFilters() {
        const baseProjects = showHidden ? allProjects : allProjects.filter(p => p.status !== 'hidden');

        const filteredProjects = baseProjects.filter(project => {
            // AND logic between categories, OR logic within each category
            return Object.keys(activeFilters).every(filterCategory => {
                const selectedValues = activeFilters[filterCategory];
                
                // If empty array, nothing should match for this category
                if (selectedValues.length === 0) return false;
                
                if (!project.tags || !project.tags[filterCategory]) return false;
                
                // Check if project has ANY of the selected values for this category (OR logic)
                return selectedValues.some(selectedValue => 
                    project.tags[filterCategory].includes(selectedValue)
                );
            });
        });
        renderProjects(filteredProjects);
    }
    
    // --- Easter Egg to Show Hidden Projects ---
    let clickCount = 0;
    let clickTimer = null;
    document.getElementById('copyright-symbol').addEventListener('click', () => {
        clickCount++;
        if (clickTimer) clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clickCount = 0; }, 2000);

        if (clickCount === 5) {
            window.location.href = window.location.pathname + '?show=hidden';
        }
    });
});