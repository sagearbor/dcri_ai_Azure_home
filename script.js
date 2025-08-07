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

        for (const category in allTags) {
            const friendlyCat = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const options = Array.from(allTags[category]).sort().map(tag =>
                `<option value="${tag}">${tag}</option>`
            ).join('');

            const filterGroup = document.createElement('div');
            filterGroup.className = 'col-md-4';
            filterGroup.innerHTML = `
                <div class="form-floating">
                    <select class="form-select" id="filter-${category}" data-category="${category}" multiple>
                        ${options}
                    </select>
                    <label for="filter-${category}">${friendlyCat}</label>
                    <div class="form-text mt-1">
                        <small>
                            <a href="#" class="select-all-link me-2" data-category="${category}">Select All</a>
                            <a href="#" class="select-none-link" data-category="${category}">Select None</a>
                        </small>
                    </div>
                </div>
            `;
            filtersContainer.appendChild(filterGroup);
        }

        // Add event listeners to new dropdowns
        filtersContainer.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', handleFilterChange);
        });

        // Add select all/none functionality
        filtersContainer.querySelectorAll('.select-all-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = e.target.dataset.category;
                const select = document.getElementById(`filter-${category}`);
                Array.from(select.options).forEach(option => option.selected = true);
                handleFilterChange({ target: select });
            });
        });

        filtersContainer.querySelectorAll('.select-none-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = e.target.dataset.category;
                const select = document.getElementById(`filter-${category}`);
                Array.from(select.options).forEach(option => option.selected = false);
                handleFilterChange({ target: select });
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
    function handleFilterChange(e) {
        const category = e.target.dataset.category;
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);

        if (selectedOptions.length > 0) {
            activeFilters[category] = selectedOptions;
        } else {
            delete activeFilters[category];
        }
        applyFilters();
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