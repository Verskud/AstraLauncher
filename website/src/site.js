const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (motionAllowed && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.remove('is-waiting'); observer.unobserve(entry.target); }
  }, { threshold: 0.08 });
  for (const element of document.querySelectorAll('.reveal')) {
    if (element.getBoundingClientRect().top > window.innerHeight) element.classList.add('is-waiting');
    observer.observe(element);
  }
}
