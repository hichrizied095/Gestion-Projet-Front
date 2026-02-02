import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone:false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  username: string | null = null;
  role: string | null = null;
  currentYear: number = new Date().getFullYear();
  showScrollButton: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Récupérer les informations de l'utilisateur depuis localStorage
    this.username = localStorage.getItem('username');
    this.role = localStorage.getItem('role');

    // Gérer le bouton scroll-to-top
    this.handleScrollButton();
  }

  logout(): void {
    // Supprimer les données de session
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    
    // Rediriger vers la page de login
    this.router.navigate(['/login']);
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  onImageError(event: any): void {
    // Si l'image ne charge pas, afficher un placeholder
    event.target.style.display = 'none';
    console.log('Image failed to load, using placeholder');
  }

  onBuildingImageError(event: any): void {
    // Cacher l'image et afficher le placeholder
    event.target.style.display = 'none';
    const placeholder = document.getElementById('buildingPlaceholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
    console.log('Building image failed to load, showing placeholder');
  }

  // Afficher/masquer le bouton scroll-to-top selon le scroll
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.handleScrollButton();
  }

  private handleScrollButton(): void {
    this.showScrollButton = window.pageYOffset > 300;
  }
}