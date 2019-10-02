function handleClickAway(e) {
  const toggleButtons = document.querySelectorAll('[data-dropdown-id]');
  toggleButtons.forEach((toggleButton) => {
    if (toggleButton.contains(e.target)) {
      return;
    }
    const dropdownId = toggleButton.getAttribute('data-dropdown-id');
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
      dropdown.classList.remove('dropdown--toggled');
    }
  });
}

function toggleDropdown(e) {
  const { currentTarget, target } = e;
  const dropdownId = currentTarget.getAttribute('data-dropdown-id');
  const dropdown = document.getElementById(dropdownId);
  // exclude dropdown itself
  if (!dropdown || dropdown.contains(target)) {
    return;
  }
  dropdown.classList.toggle('dropdown--toggled');
}

export default function setupDropdown() {
  document.body.removeEventListener('click', handleClickAway);
  document.body.addEventListener('click', handleClickAway);

  const toggleButtons = document.querySelectorAll('[data-dropdown-id]');
  toggleButtons.forEach((toggleButton) => {
    toggleButton.removeEventListener('click', toggleDropdown);
    toggleButton.addEventListener('click', toggleDropdown);
  });
}
