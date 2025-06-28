export function getUserType() {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.userType || null; // Cambiado para no devolver 'administrador' por defecto
}

export function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function isAuthenticated() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}