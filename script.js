document.addEventListener('DOMContentLoaded', () => {
    const projectsContainer = document.getElementById('projects-container');
    const filtersContainer = document.getElementById('filters-container');
    const filterTitleRow = filtersContainer.querySelector('.col-12'); // Keep the title row

    let allProjects = [];
    let activeFilters = {};

    // Check URL for a flag to show hidden projects
    const urlParams = new URLSearchParams(window.location.search);
    const showHidden = urlParams.get('show') === 'hidden';

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
        renderProjects(projectsToDisplay); // Show all public projects by default
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
        projectsContainer.innerHTML = '';
        if (projects.length === 0) {
            projectsContainer.innerHTML = `<div class="col-12"><p class="text-muted text-center lead mt-5">No projects match the selected filters.</p></div>`;
            return;
        }
        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'col-md-4 project-card';
            if (project.status === 'hidden') {
                card.dataset.status = 'hidden';
            }
            card.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title"><i class="bi ${project.icon || 'bi-box-seam'} me-2"></i>${project.title}</h5>
                        <p class="card-text text-body-secondary">${project.description}</p>
                        <div class="mt-auto pt-3">
                           <a href="${project.url}" class="btn btn-primary w-100" target="_blank" rel="noopener noreferrer">Go to Project</a>
                        </div>
                    </div>
                </div>
            `;
            projectsContainer.appendChild(card);
        });
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
            const checkedBoxes = filtersContainer.querySelectorAll(`input[data-category="${category}"]:checked`);
            const values = Array.from(checkedBoxes).map(cb => cb.value);
            
            if (values.length > 0) {
                activeFilters[category] = values;
            }
            
            // Update badge count
            const badge = document.getElementById(`badge-${category}`);
            if (badge) {
                badge.textContent = values.length;
                badge.className = values.length > 0 ? 'badge bg-primary ms-auto me-3' : 'badge bg-secondary ms-auto me-3';
            }
        });
    }
    
    function applyFilters() {
        const baseProjects = showHidden ? allProjects : allProjects.filter(p => p.status !== 'hidden');

        const filteredProjects = baseProjects.filter(project => {
            // AND logic between categories, OR logic within each category
            return Object.keys(activeFilters).every(filterCategory => {
                if (!project.tags || !project.tags[filterCategory]) return false;
                
                // Check if project has ANY of the selected values for this category (OR logic)
                return activeFilters[filterCategory].some(selectedValue => 
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