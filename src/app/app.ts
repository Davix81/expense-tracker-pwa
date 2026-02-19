import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly settingsService = inject(SettingsService);

  ngOnInit(): void {
    // Load settings at application startup
    // Requirements: 10.5
    this.settingsService.loadSettings().subscribe({
      error: (error) => {
        console.error('Error loading settings at startup:', error);
        // Settings will use default values if loading fails
      }
    });
  }
}
