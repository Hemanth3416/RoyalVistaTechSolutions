document.addEventListener('DOMContentLoaded', () => {

    /* --- Utility: Helpers --- */
    function encodeTitle(text) {
        if (!text) return "";
        return encodeURIComponent(text);
    }

    /* --- Navigation --- */
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (navbar && window.scrollY > 50) {
            navbar.style.background = 'rgba(13, 13, 13, 0.98)';
        } else if (navbar) {
            navbar.style.background = 'rgba(13, 13, 13, 0.95)';
        }
    });

    /* --- Portfolio Filter (Updated Categories) --- */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioGrid = document.getElementById('portfolioGrid');

    if (filterBtns.length > 0 && portfolioGrid) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter');

                // Get dynamic items live inside the click event
                const dynamicItems = portfolioGrid.querySelectorAll('.portfolio-item');
                dynamicItems.forEach(item => {
                    const cat = item.getAttribute('data-category');
                    if (filter === 'all' || filter === cat) {
                        item.style.display = 'block';
                        item.style.opacity = '1';
                    } else {
                        item.style.display = 'none';
                        item.style.opacity = '0';
                    }
                });
            });
        });
    }


    /* --- Portfolio Modal Logic --- */
    const modal = document.getElementById('portfolioPreviewModal');
    const modalMedia = document.getElementById('modalMedia');
    const modalTitle = document.getElementById('modalTitle');
    const modalCategory = document.getElementById('modalCategory');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    window.closePreviewModal = function () {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    };

    if (modal) {
        // Use event delegation for dynamically loaded portfolio items
        document.body.addEventListener('click', (e) => {
            const item = e.target.closest('.portfolio-item');
            if (item) {
                if (e.target.tagName === 'A' || e.target.closest('a')) return;

                const img = item.querySelector('img');
                const title = item.querySelector('h3') ? item.querySelector('h3').innerText : 'Project';
                const category = item.getAttribute('data-category') || 'Design';
                const link = item.getAttribute('data-link') || '';

                // Video Detection Logic
                let videoEmbed = null;
                if (link.includes('youtube.com/watch?v=')) {
                    const vid = link.split('v=')[1].split('&')[0];
                    videoEmbed = `https://www.youtube.com/embed/${vid}`;
                } else if (link.includes('youtu.be/')) {
                    const vid = link.split('be/')[1].split('?')[0];
                    videoEmbed = `https://www.youtube.com/embed/${vid}`;
                } else if (link.includes('vimeo.com/')) {
                    const vid = link.split('vimeo.com/')[1].split('?')[0];
                    videoEmbed = `https://player.vimeo.com/video/${vid}`;
                }

                // If link exists and is NOT a video, redirect the user immediately!
                if (!videoEmbed && link && link !== '#' && link.toLowerCase() !== 'n/a') {
                    window.open(link, '_blank');
                    return; // Stop the modal from opening
                }

                if (modalTitle) modalTitle.innerText = title;
                if (modalCategory) modalCategory.innerText = category;
                if (modalMedia) {
                    modalMedia.innerHTML = '';

                    if (videoEmbed) {
                        modalMedia.innerHTML = `<iframe src="${videoEmbed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; height:100%; aspect-ratio:16/9;"></iframe>`;
                    } else if (img) {
                        const newImg = document.createElement('img');
                        newImg.src = img.src;
                        newImg.alt = title;
                        modalMedia.appendChild(newImg);
                    } else {
                        modalMedia.innerHTML = '<p style="color:#fff;">Preview not available</p>';
                    }
                }

                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closePreviewModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) window.closePreviewModal();
        });
    }

    // --- Analytics Tracking Middleware ---
    window.trackEvent = function (eventName, eventParams = {}) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, eventParams);
        } else {
            console.log(`[Analytics] ${eventName}:`, eventParams);
        }
    };

    // --- Centralized Backend API ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzaeXsWwp_mpflTdKDijs95HY9k6Ivj1FGkXihg1d1ApXhHYhBrxHBFio3k6QHMSaFThg/exec';

    // --- Dynamic Portfolio Loading via Google Sheets ---
    const dynamicPortfolioGrid = document.getElementById('portfolioGrid');
    if (dynamicPortfolioGrid) {
        // Premium Loading State
        dynamicPortfolioGrid.innerHTML = `
            <div style="grid-column: 1 / -1; min-height: 200px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-muted); opacity:0.7;">
                <i class="fas fa-circle-notch fa-spin" style="font-size:2.5rem; margin-bottom:1rem; color:var(--primary-color);"></i>
                <p>Loading Portfolio...</p>
            </div>
        `;
        const forceRefreshUrl = SCRIPT_URL + '?action=get_portfolio&t=' + new Date().getTime();
        fetch(forceRefreshUrl, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error("Sheets Error:", data.error);
                    return;
                }

                // Reverse the array first so newest rows (at bottom of sheet) appear at the top naturally
                data.reverse();

                // Sort array gracefully even if dates are blank
                data.sort((a, b) => {
                    const timeA = a.Date ? new Date(a.Date).getTime() : 0;
                    const timeB = b.Date ? new Date(b.Date).getTime() : 0;
                    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
                });
                if (data.length === 0) {
                    dynamicPortfolioGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; min-height: 200px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-muted); padding:3rem; border:1px dashed #333; border-radius:12px;">
                            <i class="fas fa-folder-open" style="font-size:2.5rem; margin-bottom:1rem; opacity:0.5;"></i>
                            <p>No portfolio items have been published yet.</p>
                        </div>
                    `;
                    return;
                }

                dynamicPortfolioGrid.innerHTML = ''; // Clear fallback items

                data.forEach(item => {
                    if (!item.Title) return; // Skip empty rows

                    // Match the filter classes (web, logo, etc.) based on Categories like 'Web Design'
                    let categoryClass = 'other';
                    if (item.Category) {
                        const lowCat = item.Category.toLowerCase();
                        if (lowCat.includes('web')) categoryClass = 'web';
                        else if (lowCat.includes('logo')) categoryClass = 'logo';
                        else if (lowCat.includes('thumb')) categoryClass = 'thumbnails';
                        else if (lowCat.includes('post')) categoryClass = 'posts';
                        else if (lowCat.includes('invit')) categoryClass = 'invitations';
                    }

                    const defaultImg = `<div class="placeholder-img" style="background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; height:100%; aspect-ratio:16/9; font-weight:bold;">${item.Category || 'PROJECT'}</div>`;
                    const imgHtml = item.ImageURL ? `<img src="${item.ImageURL}" alt="${item.Title}" style="width:100%; height:100%; object-fit:cover;">` : defaultImg;

                    const html = `
                        <div class="portfolio-item card" data-category="${categoryClass}" data-link="${item.ProjectLink || '#'}">
                            <div class="portfolio-img">
                                ${imgHtml}
                                <span class="sample-badge">Click to View</span>
                            </div>
                            <div class="portfolio-overlay">
                                <h3>${item.Title}</h3>
                                <p><span style="color: #e0e0e0;">${item.Category || 'Project'}</span></p>
                                <p style="font-size: 0.9em; margin-top:5px;">${item.Description || ''}</p>
                            </div>
                        </div>
                    `;
                    dynamicPortfolioGrid.insertAdjacentHTML('beforeend', html);
                });
            })
            .catch(err => {
                console.error("Error loading portfolio data from sheets:", err);
            });
    }

    // --- Dynamic Jobs Loading via Google Sheets ---
    const jobsGrid = document.getElementById('jobsGrid');
    const jobFilterContainer = document.getElementById('jobFilterContainer');
    const jobSearchInput = document.getElementById('jobSearchInput');
    let allJobsData = [];

    // Task 1: Single, Stable Root Event Listener for Job Card Clicks (SPA-style Navigation)
    if (jobsGrid) {
        jobsGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.job-card');
            const shareBtn = e.target.closest('button');

            // If we clicked the card but NOT the share button...
            if (card && !shareBtn) {
                // If on same page, use modal instead of reload
                if (card.href && card.href.includes(window.location.pathname)) {
                    e.preventDefault(); 
                    const index = card.getAttribute('data-index');
                    if (index !== null) {
                        openJobModal(parseInt(index));
                    }
                }
            }
        });
    }

    // Smart fallback parsing for Google Sheets column names
    function getJobVal(job, possibleKeys) {
        if (!job) return null;
        for (let key in job) {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (possibleKeys.includes(cleanKey) && job[key]) {
                const val = job[key];
                return (typeof val === 'string' && val.trim().toLowerCase() === 'n/a') ? null : val;
            }
        }
        return null;
    }

    function parseJobRow(rawJob) {
        return {
            Title: getJobVal(rawJob, ['title', 'jobtitle', 'name']) || 'Untitled',
            Image: getJobVal(rawJob, ['imageurl', 'image', 'picture', 'img']),
            Description: getJobVal(rawJob, ['description', 'desc', 'details', 'about']),
            Link: getJobVal(rawJob, ['link', 'applylink', 'url', 'apply']),
            Categories: getJobVal(rawJob, ['categories', 'category', 'tags']),
            Date: getJobVal(rawJob, ['date', 'timestamp', 'posted', 'created'])
        }
    }

    if (jobsGrid) {
        jobsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; min-height: 200px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-muted); opacity:0.7;">
                <i class="fas fa-circle-notch fa-spin" style="font-size:2.5rem; margin-bottom:1rem; color:var(--primary-color);"></i>
                <p>Finding Opportunities...</p>
            </div>
        `;
        const jobsUrl = SCRIPT_URL + '?action=get_jobs&t=' + new Date().getTime();
        fetch(jobsUrl, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error("Jobs fetch error:", data.error);
                    return;
                }

                // Parse cleanly mapped object 
                allJobsData = data.map(j => parseJobRow(j)).filter(j => j.Title && j.Title !== 'Untitled');

                allJobsData.reverse();
                allJobsData.sort((a, b) => {
                    const tA = a.Date ? new Date(a.Date).getTime() : 0;
                    const tB = b.Date ? new Date(b.Date).getTime() : 0;
                    return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
                });

                renderJobs(allJobsData);
                setupJobFilters(allJobsData);
                checkUrlForJob(); // Task 2C: Auto-open modal if URL specifies a job
            })
            .catch(err => console.error("Error loading jobs:", err));
    }

    // Task 2C: Handle Job Title from URL
    function checkUrlForJob() {
        const params = new URLSearchParams(window.location.search);
        let jobParam = params.get("job") || params.get("slug");

        if (jobParam && allJobsData.length > 0) {
            // Find job by Title
            const foundIndex = allJobsData.findIndex(j =>
                encodeURIComponent(j.Title) === jobParam ||
                j.Title === jobParam
            );
            if (foundIndex !== -1) {
                setTimeout(() => openJobModal(foundIndex, false), 300); 
            }
        }
    }

    // Task 3: Social Share Preview (OG Tags)
    function updateDynamicMeta(job) {
        if (!job) return;
        const encodedTitle = encodeURIComponent(job.Title);
        const legacyUrl = window.location.origin + '/jobs.html?job=' + encodedTitle;

        // Update Title & OG tags for platforms that support script-based updates
        document.title = `${job.Title} | Job Updates | RoyalVista`;

        const metaTags = {
            'og:title': job.Title,
            'og:description': job.Description ? job.Description.substring(0, 160) : 'New job opportunity via RoyalVista Tech Solutions.',
            'og:image': job.Image || 'https://royalvistatechsolutions.vercel.app/assets/images/og-default.jpg',
            'og:url': legacyUrl
        };

        for (const [property, content] of Object.entries(metaTags)) {
            let tag = document.querySelector(`meta[property="${property}"]`);
            if (tag) {
                tag.content = content;
            } else {
                tag = document.createElement('meta');
                tag.setAttribute('property', property);
                tag.content = content;
                document.head.appendChild(tag);
            }
        }
    }

    function renderJobs(jobsToRender) {
        if (!jobsGrid) return;
        jobsGrid.innerHTML = '';

        if (jobsToRender.length === 0) {
            jobsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align:center; padding: 4rem 1rem; color:var(--text-muted); font-size:1.2rem; background:var(--card-bg); border-radius:12px; border:1px solid #333;">
                    <i class="fas fa-search" style="font-size:2.5rem; margin-bottom:1rem; opacity:0.5; color:var(--primary-color);"></i>
                    <br>No jobs found matching your search.
                </div>
            `;
            return;
        }

        jobsToRender.forEach((job, renderIndex) => {
            // Get original index in allJobsData
            const originalIndex = allJobsData.indexOf(job);
            
            const cats = job.Categories ? String(job.Categories).split(',').map(c => c.trim()) : [];
            const catBadges = cats.map(c => `<span class="job-category-badge" style="background:#222; color:#03dac6; padding:2px 8px; border-radius:12px; font-size:0.75rem; margin-right:5px; display:inline-block; border: 1px solid #03dac6;">${c}</span>`).join('');

            const shareMsg = `Check out this job opportunity: ${job.Title}\n${job.Link || window.location.href}`;

            const imageUrl = job.Image || null;
            const imgHtml = imageUrl ? `<img src="${imageUrl}" alt="${job.Title}" style="width:100%; height:180px; object-fit:cover;">` : `<div style="height:180px; background:var(--primary); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">${cats[0] || 'JOB UPDATE'}</div>`;

            // New Job Badge Logic (within 24 hours)
            let newBadgeHtml = '';
            if (job.Date) {
                const postDate = new Date(job.Date);
                const now = new Date();
                const diffTime = Math.abs(now - postDate);
                const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
                if (diffHours <= 24 && !isNaN(diffHours)) {
                    newBadgeHtml = `<div style="position:absolute; top:12px; left:12px; background:#e74c3c; color:#fff; padding:4px 10px; font-size:0.7rem; font-weight:800; border-radius:4px; z-index:10; box-shadow:0 2px 5px rgba(0,0,0,0.3); letter-spacing:1px;">NEW</div>`;
                }
            }

            const encodedTitleForSharing = encodeURIComponent(job.Title || '');
            
            const html = `
                <a href="jobs.html?job=${encodedTitleForSharing}" class="job-card" data-index="${originalIndex}" style="text-decoration:none; color:inherit; position:relative; display:flex; flex-direction:column; background:var(--card-bg); border-radius:12px; border:1px solid var(--border-color); overflow:hidden; transition: transform 0.3s ease, box-shadow 0.3s; cursor:pointer;">
                    ${newBadgeHtml}
                    ${imgHtml}
                    <div style="padding: 1.5rem; flex:1; display:flex; flex-direction:column;">
                        <div style="margin-bottom:0.8rem;">${catBadges}</div>
                        <h3 style="margin-bottom:0.5rem; font-size:1.25rem;">${job.Title}</h3>
                        
                        <div style="display:flex; justify-content:flex-end; align-items:center; margin-top:auto; border-top:1px solid #333; padding-top:1rem;">
                            <button onclick="event.preventDefault(); event.stopPropagation(); shareJob('${encodedTitleForSharing}')" aria-label="Share Job" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem; transition:0.2s; position:relative; z-index:15;" onmouseover="this.style.color='var(--primary-color)'" onmouseout="this.style.color='var(--text-muted)'"><i class="fas fa-share-alt"></i></button>
                        </div>
                    </div>
                </a>
            `;
            jobsGrid.insertAdjacentHTML('beforeend', html);
        });
    }

    function setupJobFilters(jobs) {
        if (!jobFilterContainer) return;
        const uniqueCats = new Set();
        jobs.forEach(j => {
            if (j.Categories) {
                j.Categories.split(',').forEach(c => {
                    const trimmed = c.trim();
                    if (trimmed) uniqueCats.add(trimmed);
                });
            }
        });

        uniqueCats.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.setAttribute('data-job-filter', cat);
            btn.innerText = cat;
            jobFilterContainer.appendChild(btn);
        });

        const filterBtns = jobFilterContainer.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterAndSearchJobs();
            });
        });

        if (jobSearchInput) {
            let debounceTimer;
            jobSearchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    filterAndSearchJobs();
                }, 300);
            });
        }
    }

    function filterAndSearchJobs() {
        const activeItem = jobFilterContainer ? jobFilterContainer.querySelector('.active') : null;
        const activeFilter = activeItem ? activeItem.getAttribute('data-job-filter') || 'all' : 'all';
        const searchTerm = jobSearchInput && jobSearchInput.value ? jobSearchInput.value.toLowerCase().trim() : '';

        const filtered = allJobsData.filter(job => {
            const fileCategories = job.Categories ? String(job.Categories).split(',').map(c => c.trim()) : [];
            const matchesFilter = activeFilter === 'all' || fileCategories.includes(activeFilter);
            const searchContent = `${job.Title} ${job.Description} ${job.Categories}`.toLowerCase();
            const matchesSearch = searchContent.includes(searchTerm);
            return matchesFilter && matchesSearch;
        });

        renderJobs(filtered);
    }

    // --- Job Modal Logic ---
    const jobDetailModal = document.getElementById('jobDetailModal');
    window.closeJobModal = function () {
        if (jobDetailModal) {
            jobDetailModal.classList.remove('active');
            document.body.style.overflow = 'auto';

            // Reset URL when closing modal (don't break landing page)
            if (window.location.pathname.includes('/jobs/')) {
                window.history.pushState({}, '', '/jobs.html');
            }
        }
    }

    // Task 2, 4, 5: Clean & Professional Sharing Links
    window.shareJob = function (encodedTitle, platform = 'Network') {
        if (!allJobsData) return;
        const job = allJobsData.find(j => encodeURIComponent(j.Title || '') === encodedTitle);
        if (!job) return;

        window.trackEvent('job_share', {
            job_title: job.Title,
            platform: platform
        });

        const encodedTitleParam = encodeURIComponent(job.Title || '');
        // Universal sharing link using query strings
        const shareUrl = window.location.origin + '/jobs.html?job=' + encodedTitleParam;
        
        // WhatsApp / Telegram optimized messages
        const platformMsgs = {
            'WhatsApp': `🔥 *Job Opening Alert* 🔥\n\n*${job.Title}*\n\nRead more & Apply here:\n${shareUrl}`,
            'Telegram': `🚀 *New Career Opportunity*\n\n*${job.Title}*\n\nView details:\n${shareUrl}`,
            'Network': `Check out this job opportunity: ${job.Title}\n${shareUrl}`
        };

        const shareText = platformMsgs[platform] || platformMsgs['Network'];

        if (platform === 'Network' && navigator.share) {
            navigator.share({
                title: job.Title,
                text: `Check out this job opportunity: ${job.Title}`,
                url: shareUrl
            }).catch(err => {
                console.log('Error sharing', err);
                navigator.clipboard.writeText(shareText);
                alert('Job link copied to clipboard!');
            });
        } else if (platform === 'WhatsApp' || platform === 'Telegram') {
             // Let the native href handle it if platforms were passed via a element, 
             // but here we are in a function, so we might need to trigger window.open
             // However, the links are already generated in modal. We just update clipboard as fallback here.
             navigator.clipboard.writeText(shareText);
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(shareText);
            alert('Job link copied to your clipboard!');
        }
    }

    window.openJobModal = function (jobIndex, shouldPushState = true) {
        if (!allJobsData || allJobsData.length === 0) return;
        const job = allJobsData[jobIndex];
        if (!job) return;

        // Task 3: Update OG Meta dynamically
        updateDynamicMeta(job);

        // Restore URL behavior (Legacy ?job= style)
        if (shouldPushState) {
            const encodedTitle = encodeURIComponent(job.Title);
            window.history.replaceState({ jobIndex }, job.Title, `?job=${encodedTitle}`);
        }

        const cats = job.Categories ? String(job.Categories).split(',').map(c => c.trim()) : [];
        const encodedTitle = encodeURIComponent(job.Title || '');

        window.trackEvent('job_view', {
            job_title: job.Title,
            category: cats[0] || 'Uncategorized'
        });

        document.getElementById('jobModalBadges').innerHTML = cats.map(c => `<span style="background:#222; color:#03dac6; padding:4px 12px; border-radius:20px; font-size:0.8rem; margin-right:8px; display:inline-block; border: 1px solid #03dac6;">${c}</span>`).join('');
        document.getElementById('jobModalTitle').innerText = job.Title;

        const imageUrl = job.Image || null;
        const imgContainer = document.getElementById('jobModalImageContainer');
        const imgHtml = imageUrl ?
            `<img src="${imageUrl}" style="width:100%; max-height:400px; object-fit:contain; background:#000;">` :
            `<div style="height:250px; background:var(--accent-gradient); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; border-radius:12px; font-weight:bold;">
                <i class="fas fa-briefcase" style="font-size:3rem; margin-bottom:1rem; opacity:0.8;"></i>
                <p style="color:#fff; margin:0; font-size:1.2rem;">${cats[0] || 'Job Opportunity'}</p>
             </div>`;
        imgContainer.innerHTML = imgHtml;
        imgContainer.style.display = 'block';

        // Custom Layout for Desc -> Apply -> Share
        const encodedLink = encodeURIComponent(job.Link || '#');
        const encodedApplyTitle = encodeURIComponent(job.Title || '');
        const applyBtnHtml = (job.Link && job.Link.trim() !== '' && job.Link.trim().toLowerCase() !== 'n/a') ?
            `<div style="margin-top:2rem; margin-bottom:1.5rem;"><a href="${job.Link}" target="_blank" onclick="window.trackEvent('job_apply_click', { job_title: decodeURIComponent('${encodedApplyTitle}'), apply_link: decodeURIComponent('${encodedLink}') })" class="btn btn-primary" style="display:inline-flex; align-items:center; padding:12px 28px; font-weight:bold; border-radius:50px; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 15px rgba(3, 218, 198, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"><i class="fas fa-paper-plane" style="margin-right:8px;"></i> Apply Now</a></div>`
            : '<div style="margin-top:2rem;"></div>';

        // Build internal site URL for dynamic sharing (Legacy format)
        const encodedTitleParam = encodeURIComponent(job.Title || '');
        const internalShareUrl = window.location.origin + '/jobs.html?job=' + encodedTitleParam;
        const waMsg = encodeURIComponent(`🔥 *Job Opening Alert* 🔥\n\n*${job.Title}*\n\nApply here:\n${internalShareUrl}`);
        const tgMsg = encodeURIComponent(`🚀 *New Opportunity:* ${job.Title}\n${internalShareUrl}`);
        
        const waLink = `https://wa.me/?text=${waMsg}`;
        const tgLink = `https://t.me/share/url?url=${encodeURIComponent(internalShareUrl)}&text=${encodeURIComponent('🚀 New Job Opportunity: ' + job.Title)}`;

        document.getElementById('jobModalDescArea').innerHTML = `
            <div style="color:var(--text-muted); line-height:1.8; white-space:pre-wrap; font-size:1.05rem;">${job.Description || 'No description provided.'}</div>
            ${applyBtnHtml}
            <div style="display:flex; gap:12px; align-items:center; padding-top:1.5rem; border-top:1px solid var(--border-color);">
                <span style="color:var(--text-muted); font-size:0.95rem; margin-right:5px; font-weight:600;">Share this job:</span>
                <a href="${waLink}" target="_blank" onclick="window.trackEvent('job_share', {job_title: decodeURIComponent('${encodedTitle}'), platform: 'WhatsApp'})" title="Share on WhatsApp" style="background:#25D366; color:#fff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; text-decoration:none; transition:0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-whatsapp" style="font-size:1.3rem;"></i></a>
                <a href="${tgLink}" target="_blank" onclick="window.trackEvent('job_share', {job_title: decodeURIComponent('${encodedTitle}'), platform: 'Telegram'})" title="Share on Telegram" style="background:#0088cc; color:#fff; width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:50%; text-decoration:none; transition:0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fab fa-telegram-plane" style="font-size:1.3rem;"></i></a>
                <button onclick="window.shareJob('${encodedTitle}')" title="More Options" style="background:#555; color:#fff; width:45px; height:45px; border:none; border-radius:50%; cursor:pointer; transition:0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fas fa-share-alt" style="font-size:1.2rem;"></i></button>
                <button onclick="navigator.clipboard.writeText('${internalShareUrl}'); window.trackEvent('job_share', {job_title: decodeURIComponent('${encodedTitle}'), platform: 'Clipboard'}); this.innerHTML='<i class=\\\'fas fa-check\\\'></i>'; setTimeout(() => this.innerHTML='<i class=\\\'fas fa-link\\\'></i>', 2000);" title="Copy Link" style="background:#333; color:#fff; width:45px; height:45px; border:none; border-radius:50%; cursor:pointer; transition:0.2s; margin-left:auto;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"><i class="fas fa-link" style="font-size:1.2rem;"></i></button>
            </div>
        `;

        // Process Suggested Jobs
        const suggestedContainer = document.getElementById('jobModalSuggested');
        if (suggestedContainer) {
            suggestedContainer.innerHTML = '';
            let suggestedJobs = allJobsData.filter(j => j !== job);

            // Sort to prioritize same categories
            suggestedJobs.sort((a, b) => {
                const aCats = a.Categories ? String(a.Categories).split(',').map(c => c.trim()) : [];
                const bCats = b.Categories ? String(b.Categories).split(',').map(c => c.trim()) : [];
                const aMatches = cats.filter(c => aCats.includes(c)).length;
                const bMatches = cats.filter(c => bCats.includes(c)).length;
                return bMatches - aMatches;
            });

            const topSuggested = suggestedJobs.slice(0, 3);
            if (topSuggested.length === 0) {
                suggestedContainer.innerHTML = '<p style="color:#666; font-size:0.9rem;">No suggested jobs found.</p>';
            } else {
                topSuggested.forEach(sj => {
                    const originalSjIndex = allJobsData.indexOf(sj);
                    const sjImg = sj.Image || null;
                    const sjImgHtml = sjImg ? `<img src="${sjImg}" style="width:50px; height:50px; object-fit:cover; border-radius:6px; flex-shrink:0;">` : `<div style="width:50px; height:50px; border-radius:6px; background:#222; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:10px; color:#555;">JOB</div>`;
                    const sjCats = sj.Categories ? String(sj.Categories).split(',').map(c => c.trim()).join(', ') : '';

                    const el = `
                        <div onclick="event.stopPropagation(); window.trackEvent('job_suggested_click', { job_title: decodeURIComponent('${encodeURIComponent(sj.Title || '')}') }); openJobModal(${originalSjIndex})" style="display:flex; gap:12px; background:#1a1a1a; padding:12px; border-radius:8px; cursor:pointer; transition:0.2s; border:1px solid transparent;" onmouseover="this.style.borderColor='var(--primary-color)'" onmouseout="this.style.borderColor='transparent'">
                            ${sjImgHtml}
                            <div style="flex:1; overflow:hidden; display:flex; flex-direction:column; justify-content:center;">
                                <h4 style="font-size:0.95rem; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#fff;">${sj.Title}</h4>
                                <span style="font-size:0.75rem; color:var(--primary-color); font-weight:bold;">${sjCats}</span>
                            </div>
                        </div>
                    `;
                    suggestedContainer.insertAdjacentHTML('beforeend', el);
                });
            }
        }

        if (jobDetailModal) {
            jobDetailModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus on the scrollable content container
            const modalContent = jobDetailModal.querySelector('.portfolio-modal-content');
            if (modalContent) modalContent.scrollTop = 0;
        }
    }

    if (jobDetailModal) {
        jobDetailModal.addEventListener('click', (e) => {
            if (e.target === jobDetailModal) window.closeJobModal();
        });
    }

    // --- Connect Contact Form to Google Sheets ---
    const contactForm = document.getElementById('contactForm');
    const formSuccessMessage = document.getElementById('formSuccessMessage');

    if (contactForm) {

        const phoneInput = contactForm.querySelector('input[name="phone"]');
        const phoneError = document.getElementById('phoneError');
        // --- Real-Time Phone Validation ---
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                // Remove non-numeric characters immediately
                let val = e.target.value.replace(/\D/g, '');
                // Max length 10
                if (val.length > 10) val = val.slice(0, 10);
                e.target.value = val;

                // Show inline error if typing but less than 10 digits
                if (val.length > 0 && val.length < 10) {
                    if (phoneError) phoneError.style.display = 'block';
                } else {
                    if (phoneError) phoneError.style.display = 'none';
                }
            });
        }

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (phoneInput && phoneInput.value.length !== 10) {
                if (phoneError) phoneError.style.display = 'block';
                return;
            }


            const submitBtn = document.getElementById('submitInquiryBtn');
            const originalText = submitBtn.innerText;
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Submitting...';
            submitBtn.disabled = true;

            window.trackEvent('form_submit', { form_type: 'contact_form' });

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            data.action = 'submit';

            // Format Timestamp as YYYY-MM-DD HH:MM:SS
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            data.timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            try {
                // Encode the data as x-www-form-urlencoded so Google Script doPost(e) native e.parameter can read it
                const urlEncodedData = new URLSearchParams(data).toString();

                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: urlEncodedData
                });

                // Assume success since no-cors hides response
                contactForm.reset();
                if (formSuccessMessage) {
                    formSuccessMessage.style.display = 'block';
                    setTimeout(() => { formSuccessMessage.style.display = 'none'; }, 10000);
                }
            } catch (error) {
                console.error('Error submitting form', error);
                alert("Network error. Please try again or check your internet connection.");
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});


