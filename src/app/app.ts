import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaLifecycleService } from './services/pwa-lifecycle.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly pwaLifecycleService = inject(PwaLifecycleService);

  ngOnInit(): void {
    // Initialize PWA lifecycle handling
    // This ensures authentication state is preserved across PWA lifecycle events
    // Requirements: 4.1, 4.2, 4.4
    console.log('PWA lifecycle service initialized');
    
    // Log platform information for debugging
    const platformInfo = this.pwaLifecycleService.getPlatformInfo();
    console.log('Platform info:', platformInfo);
    
    // Verify WebAuthn functionality in PWA context
    this.pwaLifecycleService.verifyWebAuthnInPwaContext().then(result => {
      if (result.isSupported) {
        console.log('WebAuthn verified in PWA context');
      } else {
        console.warn('WebAuthn verification failed:', result.error);
      }
    });
  }
}
