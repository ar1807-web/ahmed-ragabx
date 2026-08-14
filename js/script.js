/**
 * PERSONAL ENGINEERING PORTFOLIO — SCRIPT ENGINE
 * Ahmed Ragab | Structural BIM Coordinator & Digital Engineering Specialist
 * ES6+ Vanilla JavaScript — Zero Framework Dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initStructuralCanvas();
  initNavigation();
  initScrollSpy();
  initScrollReveal();
  initProjectPortfolio();
  initContactForm();
});

/* ==========================================================================
   1. THEME ENGINE (DARK / LIGHT MODE & LOCALSTORAGE PERSISTENCE)
   ========================================================================== */
function initThemeEngine() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const storedTheme = localStorage.getItem('ao_theme') || 'dark';
  
  // Set initial theme
  document.documentElement.setAttribute('data-theme', storedTheme);
  updateThemeIcon(storedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('ao_theme', newTheme);
      updateThemeIcon(newTheme);
      
      // Dispatch custom event to notify canvas
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
    });
  }
}

function updateThemeIcon(theme) {
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');
  if (sunIcon && moonIcon) {
    if (theme === 'light') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }
}

/* ==========================================================================
   2. INTERACTIVE STRUCTURAL NODE CANVAS (3D TRUSS & COLUMN GEOMETRY)
   ========================================================================== */
function initStructuralCanvas() {
  const canvas = document.getElementById('structuralCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let width, height;
  let animationFrameId;
  let angleX = -0.4;
  let angleY = 0.6;
  let targetAngleX = -0.4;
  let targetAngleY = 0.6;
  let isHovered = false;

  // Structural nodes (3D spatial grid coordinates)
  // Generating a 2-tier spatial structural frame with truss cross-bracing
  const rawNodes = [
    // Foundation level (Z = -60)
    { x: -70, y: -70, z: -60 }, { x: 70, y: -70, z: -60 },
    { x: 70, y: 70, z: -60 },   { x: -70, y: 70, z: -60 },
    // Mid level (Z = 0)
    { x: -70, y: -70, z: 0 },   { x: 70, y: -70, z: 0 },
    { x: 70, y: 70, z: 0 },     { x: -70, y: 70, z: 0 },
    // Top Roof Truss level (Z = 60)
    { x: -70, y: -70, z: 60 },  { x: 70, y: -70, z: 60 },
    { x: 70, y: 70, z: 60 },    { x: -70, y: 70, z: 60 },
    // Crown / Apex Node (Z = 95)
    { x: 0, y: 0, z: 95 }
  ];

  // Structural members (connecting node indices)
  const members = [
    // Columns (Foundations to Mid)
    [0, 4], [1, 5], [2, 6], [3, 7],
    // Columns (Mid to Top)
    [4, 8], [5, 9], [6, 10], [7, 11],
    
    // Level 1 Beams
    [4, 5], [5, 6], [6, 7], [7, 4],
    // Level 1 Diagonal Bracing
    [4, 6], [5, 7],
    
    // Level 2 Roof Beams
    [8, 9], [9, 10], [10, 11], [11, 8],
    
    // Roof Apex Rafters / Spatial Truss
    [8, 12], [9, 12], [10, 12], [11, 12],
    
    // Foundation Tie Beams
    [0, 1], [1, 2], [2, 3], [3, 0]
  ];

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resize);
  resize();

  // Mouse interaction
  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - width / 2;
    const y = e.clientY - rect.top - height / 2;
    targetAngleY = (x / width) * 2.5;
    targetAngleX = -(y / height) * 2.5;
    isHovered = true;
  });

  canvas.parentElement.addEventListener('mouseleave', () => {
    isHovered = false;
  });

  function project(p, cx, cy, fov) {
    // Rotate Y
    let cosY = Math.cos(angleY), sinY = Math.sin(angleY);
    let x1 = p.x * cosY + p.z * sinY;
    let z1 = -p.x * sinY + p.z * cosY;

    // Rotate X
    let cosX = Math.cos(angleX), sinX = Math.sin(angleX);
    let y1 = p.y * cosX - z1 * sinX;
    let z2 = p.y * sinX + z1 * cosX;

    let scale = fov / (fov + z2 + 250);
    return {
      x: cx + x1 * scale,
      y: cy + y1 * scale,
      scale: scale,
      z: z2
    };
  }

  function render() {
    // Smooth rotation interpolation
    if (!isHovered) {
      targetAngleY += 0.004;
    }
    angleX += (targetAngleX - angleX) * 0.05;
    angleY += (targetAngleY - angleY) * 0.05;

    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const memberColor = isLight ? 'rgba(2, 132, 199, 0.45)' : 'rgba(14, 165, 233, 0.55)';
    const nodeColor = isLight ? '#0284C7' : '#38BDF8';
    const gridColor = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.05)';
    const textColor = isLight ? 'rgba(71, 85, 105, 0.8)' : 'rgba(156, 163, 175, 0.8)';

    const cx = width / 2;
    const cy = height / 2 + 10;
    const fov = 340;

    // Draw background CAD origin grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let r = -120; r <= 120; r += 40) {
      const p1 = project({ x: r, y: -120, z: -60 }, cx, cy, fov);
      const p2 = project({ x: r, y: 120, z: -60 }, cx, cy, fov);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      const p3 = project({ x: -120, y: r, z: -60 }, cx, cy, fov);
      const p4 = project({ x: 120, y: r, z: -60 }, cx, cy, fov);
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
    }
    ctx.stroke();

    // Project all nodes
    const projected = rawNodes.map(node => project(node, cx, cy, fov));

    // Draw structural members (Beams & Columns)
    ctx.strokeStyle = memberColor;
    ctx.lineWidth = 1.8;
    members.forEach(([i, j]) => {
      const p1 = projected[i];
      const p2 = projected[j];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Draw structural joint nodes & coordinates
    projected.forEach((p, idx) => {
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * p.scale, 0, Math.PI * 2);
      ctx.fill();

      // Draw node label for key nodes
      if (idx === 12 || idx === 0 || idx === 8) {
        ctx.fillStyle = textColor;
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(`N${idx + 1}`, p.x + 6, p.y - 4);
      }
    });

    // Draw live rotation readout in corner
    ctx.fillStyle = textColor;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`ROT_X: ${(angleX * 57.3).toFixed(1)}°  ROT_Y: ${(angleY * 57.3).toFixed(1)}°`, 12, height - 12);

    animationFrameId = requestAnimationFrame(render);
  }

  // Check reduced motion
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    render();
  } else {
    // Single static render
    render();
    cancelAnimationFrame(animationFrameId);
  }
}

/* ==========================================================================
   3. NAVIGATION & MOBILE DRAWER
   ========================================================================== */
function initNavigation() {
  const header = document.querySelector('.site-header');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

  // Sticky header shadow on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  // Mobile menu toggle
  if (mobileMenuBtn && mobileNavDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileNavDrawer.classList.contains('open');
      if (isOpen) {
        mobileNavDrawer.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      } else {
        mobileNavDrawer.classList.add('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
      }
    });

    // Close drawer when clicking any link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNavDrawer.classList.remove('open');
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/* ==========================================================================
   4. SCROLL SPY (ACTIVE NAVBAR LINK HIGHLIGHTING)
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const desktopLinks = document.querySelectorAll('.nav-links .nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        desktopLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    rootMargin: '-30% 0px -60% 0px'
  });

  sections.forEach(section => observer.observe(section));
}

/* ==========================================================================
   5. SCROLL REVEAL (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal-fade').forEach(el => el.classList.add('revealed'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal-fade').forEach(el => revealObserver.observe(el));
}

/* ==========================================================================
   6. PROJECT PORTFOLIO & CASE STUDY MODAL SYSTEM
   ========================================================================== */
const PROJECT_DATABASE = {
  'masar-makkah': {
    title: 'Masar Makkah Hotels (Plots 1NN 06 – 1NN 19 – 1SS 12)',
    category: 'mega',
    categoryLabel: 'Mega Hospitality / Mixed-use',
    location: 'Makkah, Saudi Arabia (with Umm Al Qura)',
    role: 'Structural BIM Coordinator (PI Hospitality)',
    discipline: 'Structural Design & BIM Coordination',
    scale: 'Mega-scale high-rise hospitality towers across 3 major plots (1NN 06, 1NN 19, 1SS 12)',
    structuralSystem: 'Deep foundation systems, high-strength reinforced concrete shear core walls, post-tensioned slabs, and steel podium structures',
    scope: 'Led structural design from concept through detailed design, coordinated with Architectural and MEP disciplines, managed structural BIM workflows, model quality, and project deliverables in accordance with BIM standards and milestones.',
    tools: ['Autodesk Revit', 'Navisworks Manage', 'ETABS', 'SAFE', 'ACC'],
    challenge: 'Coordinating massive high-occupancy hotel towers with dense MEP service distributions, complex elevation transitions, and strict hospitality spatial standards while maintaining full compliance with Saudi Building Code (SBC) and Umm Al Qura project guidelines.',
    solution: 'Led end-to-end structural BIM coordination, resolved critical discipline clashes early in ACC/Navisworks, and established standardized Revit modeling protocols to ensure seamless digital delivery.',
    impact: 'Delivered fully coordinated, constructible, and clash-free structural models across all 3 mega plots on schedule.',
    image: 'assets/images/project_masar_makkah.jpg'
  },
  'al-wabel-tower': {
    title: 'Al Wabel Tower at Dammam',
    category: 'commercial',
    categoryLabel: 'Commercial High-Rise Tower',
    location: 'Dammam, Saudi Arabia',
    role: 'Structural BIM Coordinator (PI Hospitality)',
    discipline: 'High-Rise Structural BIM & Coordination',
    scale: 'Landmark multi-story commercial and office tower',
    structuralSystem: 'Reinforced concrete core walls, outrigger systems, raft foundations, and perimeter moment frames',
    scope: 'Structural design review, multidisciplinary BIM coordination with MEP and facade teams, LOD 400 shop drawings, and constructability audits.',
    tools: ['Autodesk Revit', 'Navisworks Manage', 'ETABS', 'AutoCAD'],
    challenge: 'Managing tight core shaft riser tolerances and complex MEP transfer floors without compromising structural shear wall reinforcement integrity.',
    solution: 'Developed detailed 3D structural penetration reservation models and conducted automated clash detection routines in Navisworks to verify all sleeve dimensions before site execution.',
    impact: 'Zero on-site core rebar conflicts and approved fabrication-ready structural shop drawing sets.',
    image: 'assets/images/project_al_wabel_tower.jpg'
  },
  'nukhba-buildings': {
    title: 'Nukhba Buildings at Jeddah',
    category: 'commercial',
    categoryLabel: 'Residential & Mixed-Use',
    location: 'Jeddah, Saudi Arabia',
    role: 'Structural BIM Coordinator (PI Hospitality)',
    discipline: 'Structural BIM & Multidisciplinary Delivery',
    scale: 'Premium multi-building mixed-use residential development',
    structuralSystem: 'Reinforced concrete frame, flat slabs with drop panels, shear walls, and combined footing foundation',
    scope: 'Structural concept through detailed design coordination, architectural and MEP integration, model QA/QC, and BOQ extraction.',
    tools: ['Autodesk Revit', 'Navisworks', 'SAFE', 'Excel'],
    challenge: 'Aligning multiple residential building blocks with varying basement elevations, parking layouts, and municipal utility connections.',
    solution: 'Standardized shared parameter frameworks, streamlined Revit view templates, and executed weekly multidisciplinary model federation.',
    impact: 'Achieved complete clash-free alignment across all residential blocks with automated material quantity takeoffs.',
    image: 'assets/images/project_nukhba_jeddah.jpg'
  },
  'king-salman-park': {
    title: 'Buildings in King Salman Park',
    category: 'mega',
    categoryLabel: 'Mega Urban Development',
    location: 'Riyadh, Saudi Arabia',
    role: 'Structural BIM Coordinator (DAIR Engineering)',
    discipline: 'BIM Coordination & Automation',
    scale: 'Major public cultural and commercial facility buildings within King Salman Park master plan',
    structuralSystem: 'Complex architectural reinforced concrete and structural steel geometric systems',
    scope: 'Multidisciplinary BIM coordination, custom Dynamo automation tools development, Revit family libraries, BEP execution, and MIDP milestone compliance.',
    tools: ['Autodesk Revit', 'Dynamo', 'Python', 'Navisworks Manage', 'ACC'],
    challenge: 'Executing rapid model delivery under demanding master plan BIM standards while maintaining strict parameter compliance.',
    solution: 'Engineered custom Dynamo scripts and Revit add-ins to automate modeling, documentation, and parameter auditing.',
    impact: 'Significantly compressed drawing production cycles and achieved 100% compliance with client MIDP audits.',
    image: 'assets/images/project_king_salman_park.jpg'
  },
  'panorama-mall': {
    title: 'Panorama Mall Enhancement',
    category: 'commercial',
    categoryLabel: 'Commercial / Retail',
    location: 'Riyadh, Saudi Arabia',
    role: 'Structural BIM Coordinator (DAIR Engineering)',
    discipline: 'Structural BIM & Retrofit Coordination',
    scale: 'Major mall structural enhancement and expansion',
    structuralSystem: 'Reinforced concrete frames, structural steel roof spatial elements, and foundation underpinning',
    scope: 'BIM coordination, existing structure interface modeling, clash-free shop drawing production, and BEP compliance.',
    tools: ['Autodesk Revit', 'Navisworks Manage', 'Dynamo', 'ETABS'],
    challenge: 'Coordinating structural alterations within an operating retail center with strict ceiling clearance and MEP rerouting requirements.',
    solution: 'Modeled exact existing conditions and new structural interventions, automating clash verification in Navisworks.',
    impact: 'Seamless construction execution with zero interruption to existing mall structural integrity.',
    image: 'assets/images/project_panorama_mall.jpg'
  },
  'neom-projects': {
    title: 'NEOM-related Projects',
    category: 'mega',
    categoryLabel: 'Mega Projects / Digital Engineering',
    location: 'Tabuk Province, Saudi Arabia',
    role: 'Structural Engineer (PETROJET)',
    discipline: 'Structural Design & BIM Modeling',
    scale: 'Future-forward mega development infrastructure and facilities',
    structuralSystem: 'Reinforced concrete elements and advanced structural assemblies conforming to project design codes',
    scope: 'Structural design for reinforced concrete elements, Revit BIM modeling, shop drawings, schedules, and automated BOQs.',
    tools: ['Autodesk Revit', 'ETABS', 'AutoCAD', 'Excel'],
    challenge: 'High-complexity structural geometry under tight delivery milestones.',
    solution: 'Delivered verified structural models and extracted construction drawings, schedules, and BOQs directly from Revit.',
    impact: 'Constructible fabrication-ready models delivered in full compliance with design codes.',
    image: 'assets/images/project_neom.jpg'
  },
  'aramco-projects': {
    title: 'ARAMCO-related Projects',
    category: 'mega',
    categoryLabel: 'Industrial / Energy Infrastructure',
    location: 'Saudi Arabia',
    role: 'Structural Engineer (PETROJET)',
    discipline: 'Industrial Structural Design & BIM',
    scale: 'Heavy industrial concrete and steel support structures',
    structuralSystem: 'Heavy industrial foundation pads, equipment pedestals, and structural frames',
    scope: 'Structural design and detailing for reinforced concrete elements, Revit modeling, and direct BOQ extraction.',
    tools: ['Autodesk Revit', 'Navisworks', 'AutoCAD', 'ETABS'],
    challenge: 'Demanding industrial code standards and dynamic equipment loadings.',
    solution: 'Precision reinforced concrete modeling and clash verification with mechanical trades.',
    impact: 'Achieved complete code compliance and delivered accurate material takeoffs.'
  },
  'mobco-projects': {
    title: 'MOBCO Group Projects',
    category: 'mega',
    categoryLabel: 'Commercial / Fast-Track Construction',
    location: 'Saudi Arabia',
    role: 'Structural Engineer (PETROJET)',
    discipline: 'Fast-Track Structural Design & BIM',
    scale: 'High-profile commercial and mixed-use buildings',
    structuralSystem: 'Cast-in-place reinforced concrete framing and foundation systems',
    scope: 'Structural design for concrete elements, BIM modeling, construction drawings, and BOQs.',
    tools: ['Autodesk Revit', 'AutoCAD', 'ETABS', 'Excel'],
    challenge: 'Fast-track construction requiring rapid drawing issuances.',
    solution: 'Standardized Revit structural workflows and automated drawing production.',
    impact: 'Accelerated shop drawing delivery cycles with zero geometric clashes.'
  },
  'healthcare-center': {
    title: 'Healthcare Center Projects',
    category: 'healthcare',
    categoryLabel: 'Healthcare Facilities',
    location: 'Regional Deployments',
    role: 'Structural BIM Coordinator',
    discipline: 'BIM Coordination & QA/QC',
    scale: 'Specialized medical clinics and inpatient diagnostic units',
    structuralSystem: 'Reinforced concrete shear wall lateral system, drop panels, rigid foundation slabs',
    scope: 'Structural BIM modeling, critical medical equipment coordination, vibration-sensitive foundation detailing, and multidisciplinary QA/QC checks.',
    tools: ['Autodesk Revit', 'Navisworks Manage', 'Dynamo', 'ACC'],
    challenge: 'Stringent ceiling plenum coordination required for medical gas systems, heavy HVAC ductwork, and radiation-shielded structural walls.',
    solution: 'Designed comprehensive BIM opening reservation protocols, used Dynamo to track and tag all wall and slab penetrations, and validated clearances in Navisworks.',
    impact: 'Zero unapproved structural core penetrations on site; guaranteed structural integrity around critical equipment.'
  },
  'ashghal-projects': {
    title: 'Ashghal Infrastructure Projects',
    category: 'infrastructure',
    categoryLabel: 'Public Infrastructure',
    location: 'Qatar',
    role: 'BIM & Structural Engineer',
    discipline: 'Civil Infrastructure BIM & Standards',
    scale: 'Public infrastructure packages, utility structures, and retaining corridors',
    structuralSystem: 'Heavy civil reinforced concrete culverts, retaining walls, pump station substructures, and underground chambers',
    scope: 'Structural modeling and detailing following strict client GIS/BIM guidelines, LOD 400 documentation, and MIDP milestone deliveries.',
    tools: ['Autodesk Revit', 'Navisworks', 'Civil 3D', 'COBie'],
    challenge: 'Complying with rigorous public authority BIM standards, strict parameter schemas, and demanding submission checklists.',
    solution: 'Configured customized shared parameter files and Revit templates conforming to authority standards, automating model parameter validation.',
    impact: '100% compliance with client BIM validation audits; rapid handover of asset-ready digital models.'
  },
  'nas-commercial': {
    title: 'NAS Commercial Building',
    category: 'commercial',
    categoryLabel: 'Commercial / High-Rise Office',
    location: 'Commercial District',
    role: 'Structural BIM Coordinator',
    discipline: 'Structural Engineering × BIM',
    scale: 'Multi-story commercial office building with multi-level basement parking',
    structuralSystem: 'Deep raft foundation with secant pile shoring, reinforced concrete core walls, flat slabs with perimeter spandrel beams',
    scope: 'Structural BIM modeling, basement shoring coordination, shop drawings, multidisciplinary clash resolution, and BOQ validation.',
    tools: ['Autodesk Revit', 'Navisworks Manage', 'ETABS', 'AutoCAD'],
    challenge: 'High-density MEP basement routing intersecting with perimeter retaining walls, tie-back anchors, and foundation sump pit geometry.',
    solution: 'Modeled detailed 3D substructure and shoring interfaces, established clash matrix rules, and produced coordinated section drawings.',
    impact: 'Eliminated foundation construction delays and prevented costly site rework during deep basement excavation.'
  }
};

function initProjectPortfolio() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const caseStudyModal = document.getElementById('caseStudyModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');

  // Filter Buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const cardCategories = (card.getAttribute('data-category') || '').split(' ');
        if (filterValue === 'all' || cardCategories.includes(filterValue)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });

  // Modal open triggers
  document.querySelectorAll('.open-case-study-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const projectId = btn.getAttribute('data-project-id');
      const project = PROJECT_DATABASE[projectId];
      if (!project || !caseStudyModal) return;

      // Populate modal content
      document.getElementById('modalProjectTitle').textContent = project.title;
      document.getElementById('modalCategoryTag').textContent = project.categoryLabel;
      document.getElementById('modalLocation').textContent = project.location;
      document.getElementById('modalRole').textContent = project.role;
      document.getElementById('modalDiscipline').textContent = project.discipline;
      document.getElementById('modalScale').textContent = project.scale;
      document.getElementById('modalStructuralSystem').textContent = project.structuralSystem;
      document.getElementById('modalScope').textContent = project.scope;
      document.getElementById('modalChallenge').textContent = project.challenge;
      document.getElementById('modalSolution').textContent = project.solution;
      document.getElementById('modalImpact').textContent = project.impact;

      // Tools tags
      const toolsContainer = document.getElementById('modalTools');
      toolsContainer.innerHTML = '';
      project.tools.forEach(tool => {
        const span = document.createElement('span');
        span.className = 'tool-tag';
        span.textContent = tool;
        toolsContainer.appendChild(span);
      });

      // Show modal
      if (typeof caseStudyModal.showModal === 'function') {
        caseStudyModal.showModal();
      } else {
        caseStudyModal.setAttribute('open', '');
      }
      document.body.style.overflow = 'hidden';
    });
  });

  // Close modal
  function closeModal() {
    if (caseStudyModal) {
      if (typeof caseStudyModal.close === 'function') {
        caseStudyModal.close();
      } else {
        caseStudyModal.removeAttribute('open');
      }
      document.body.style.overflow = '';
    }
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (caseStudyModal) {
    // Backdrop click close
    caseStudyModal.addEventListener('click', (e) => {
      const rect = caseStudyModal.getBoundingClientRect();
      const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
      if (!isInDialog) {
        closeModal();
      }
    });

    // Keyboard escape key close
    caseStudyModal.addEventListener('cancel', () => {
      document.body.style.overflow = '';
    });
  }
}

/* ==========================================================================
   7. CONTACT FORM SUBMISSION
   ========================================================================== */
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Show success feedback
      if (formFeedback) {
        formFeedback.className = 'form-feedback success';
        formFeedback.textContent = '✓ Thank you, Ahmed Ragab has received your message and will respond promptly.';
        formFeedback.style.display = 'block';
      }

      contactForm.reset();

      setTimeout(() => {
        if (formFeedback) {
          formFeedback.style.display = 'none';
        }
      }, 7000);
    });
  }
}
