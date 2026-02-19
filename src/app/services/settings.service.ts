import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Settings, SettingsValidationResult } from '../models/settings.model';
import { GitHubStorageService } from './github-storage.service';

/**
 * Service responsible for managing application settings (categories and tags)
 * 
 * Requirements: 2.1, 2.2, 2.3
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly githubStorage = inject(GitHubStorageService);
  
  /**
   * BehaviorSubject to maintain the current state of settings
   */
  private readonly settingsSubject = new BehaviorSubject<Settings>({
    categories: [],
    tags: [],
    lastUpdated: new Date()
  });

  /**
   * Observable for the complete settings object
   * 
   * Requirements: 2.1, 2.2
   */
  public readonly settings$: Observable<Settings> = this.settingsSubject.asObservable();

  /**
   * Observable for categories only
   * 
   * Requirements: 2.1
   */
  public readonly categories$: Observable<string[]> = this.settings$.pipe(
    map(settings => settings.categories)
  );

  /**
   * Observable for tags only
   * 
   * Requirements: 2.2
   */
  public readonly tags$: Observable<string[]> = this.settings$.pipe(
    map(settings => settings.tags)
  );

   /**
    * Load settings from GitHub storage
    *
    * Requirements: 2.3, 2.5, 9.5, 11.1
    *
    * @returns Observable<Settings> - The loaded settings
    */
   loadSettings(): Observable<Settings> {
     return this.githubStorage.readSettings().pipe(
       map(settings => {
         // Update the BehaviorSubject with loaded data
         this.settingsSubject.next(settings);
         return settings;
       })
     );
   }

   /**
      * Validate a category name
      *
      * Requirements: 3.2, 3.3, 4.3, 4.4
      *
      * @param category - The category name to validate
      * @param excludeName - Optional name to exclude from duplicate check (used when editing)
      * @returns SettingsValidationResult - Validation result with errors if any
      */
     validateCategory(category: string, excludeName?: string): SettingsValidationResult {
       const errors: string[] = [];

       // Validate that category is not empty
       if (!category || category.trim().length === 0) {
         errors.push('La categoría no puede estar vacía');
       }

       // Validate that category doesn't already exist (case-insensitive)
       const currentCategories = this.settingsSubject.value.categories;
       const normalizedCategory = category.trim().toLowerCase();
       const normalizedExclude = excludeName?.trim().toLowerCase();

       const isDuplicate = currentCategories.some(existingCategory => {
         const normalizedExisting = existingCategory.trim().toLowerCase();
         return normalizedExisting === normalizedCategory && normalizedExisting !== normalizedExclude;
       });

       if (isDuplicate) {
         errors.push('Ya existe una categoría con este nombre');
       }

       return {
         valid: errors.length === 0,
         errors
       };
     }

     /**
      * Validate a tag name
      *
      * Requirements: 6.2, 6.3, 7.3, 7.4
      *
      * @param tag - The tag name to validate
      * @param excludeName - Optional name to exclude from duplicate check (used when editing)
      * @returns SettingsValidationResult - Validation result with errors if any
      */
     validateTag(tag: string, excludeName?: string): SettingsValidationResult {
       const errors: string[] = [];

       // Validate that tag is not empty
       if (!tag || tag.trim().length === 0) {
         errors.push('La etiqueta no puede estar vacía');
       }

       // Validate that tag doesn't already exist (case-insensitive)
       const currentTags = this.settingsSubject.value.tags;
       const normalizedTag = tag.trim().toLowerCase();
       const normalizedExclude = excludeName?.trim().toLowerCase();

       const isDuplicate = currentTags.some(existingTag => {
         const normalizedExisting = existingTag.trim().toLowerCase();
         return normalizedExisting === normalizedTag && normalizedExisting !== normalizedExclude;
       });

       if (isDuplicate) {
         errors.push('Ya existe una etiqueta con este nombre');
       }

       return {
         valid: errors.length === 0,
         errors
       };
     }

     /**
      * Add a new category
      *
      * Requirements: 3.2, 3.3, 3.4, 3.5
      *
      * @param category - The category name to add
      * @returns Observable<string> - The added category name
      * @throws Error if validation fails
      */
     addCategory(category: string): Observable<string> {
       // Validate the category
       const validation = this.validateCategory(category);
       if (!validation.valid) {
         throw new Error(validation.errors.join(', '));
       }

       // Get current settings
       const currentSettings = this.settingsSubject.value;
       
       // Add the new category
       const updatedSettings: Settings = {
         ...currentSettings,
         categories: [...currentSettings.categories, category.trim()],
         lastUpdated: new Date()
       };

       // Update state
       this.settingsSubject.next(updatedSettings);

       // Persist to GitHub
       return this.githubStorage.writeSettings(updatedSettings).pipe(
         map(() => category.trim())
       );
     }

     /**
      * Update an existing category
      *
      * Requirements: 4.3, 4.4, 4.5, 4.6
      *
      * @param oldName - The current category name
      * @param newName - The new category name
      * @returns Observable<string> - The updated category name
      * @throws Error if validation fails or category not found
      */
     updateCategory(oldName: string, newName: string): Observable<string> {
       // Validate the new category name (excluding the old name from duplicate check)
       const validation = this.validateCategory(newName, oldName);
       if (!validation.valid) {
         throw new Error(validation.errors.join(', '));
       }

       // Get current settings
       const currentSettings = this.settingsSubject.value;
       
       // Find the category to update
       const categoryIndex = currentSettings.categories.findIndex(
         cat => cat.toLowerCase() === oldName.toLowerCase()
       );

       if (categoryIndex === -1) {
         throw new Error('Categoría no encontrada');
       }

       // Update the category
       const updatedCategories = [...currentSettings.categories];
       updatedCategories[categoryIndex] = newName.trim();

       const updatedSettings: Settings = {
         ...currentSettings,
         categories: updatedCategories,
         lastUpdated: new Date()
       };

       // Update state
       this.settingsSubject.next(updatedSettings);

       // Persist to GitHub
       return this.githubStorage.writeSettings(updatedSettings).pipe(
         map(() => newName.trim())
       );
     }

     /**
      * Delete a category
      *
      * Requirements: 5.3, 5.4
      *
      * @param category - The category name to delete
      * @returns Observable<boolean> - True if deletion was successful
      * @throws Error if category not found
      */
     deleteCategory(category: string): Observable<boolean> {
       // Get current settings
       const currentSettings = this.settingsSubject.value;
       
       // Find the category to delete
       const categoryIndex = currentSettings.categories.findIndex(
         cat => cat.toLowerCase() === category.toLowerCase()
       );

       if (categoryIndex === -1) {
         throw new Error('Categoría no encontrada');
       }

       // Remove the category
       const updatedCategories = currentSettings.categories.filter(
         (_, index) => index !== categoryIndex
       );

       const updatedSettings: Settings = {
         ...currentSettings,
         categories: updatedCategories,
         lastUpdated: new Date()
       };

       // Update state
       this.settingsSubject.next(updatedSettings);

       // Persist to GitHub
       return this.githubStorage.writeSettings(updatedSettings).pipe(
         map(() => true)
       );
     }

     /**
      * Add a new tag
      *
      * Requirements: 6.2, 6.3, 6.4, 6.5
      *
      * @param tag - The tag name to add
      * @returns Observable<string> - The added tag name
      * @throws Error if validation fails
      */
     addTag(tag: string): Observable<string> {
       // Validate the tag
       const validation = this.validateTag(tag);
       if (!validation.valid) {
         throw new Error(validation.errors.join(', '));
       }

       // Get current settings
       const currentSettings = this.settingsSubject.value;
       
       // Add the new tag
       const updatedSettings: Settings = {
         ...currentSettings,
         tags: [...currentSettings.tags, tag.trim()],
         lastUpdated: new Date()
       };

       // Update state
       this.settingsSubject.next(updatedSettings);

       // Persist to GitHub
       return this.githubStorage.writeSettings(updatedSettings).pipe(
         map(() => tag.trim())
       );
     }

     /**
      * Update an existing tag
      *
      * Requirements: 7.3, 7.4, 7.5, 7.6
      *
      * @param oldName - The current tag name
      * @param newName - The new tag name
      * @returns Observable<string> - The updated tag name
      * @throws Error if validation fails or tag not found
      */
     updateTag(oldName: string, newName: string): Observable<string> {
       // Validate the new tag name (excluding the old name from duplicate check)
       const validation = this.validateTag(newName, oldName);
       if (!validation.valid) {
         throw new Error(validation.errors.join(', '));
       }

       // Get current settings
       const currentSettings = this.settingsSubject.value;
       
       // Find the tag to update
       const tagIndex = currentSettings.tags.findIndex(
         t => t.toLowerCase() === oldName.toLowerCase()
       );

       if (tagIndex === -1) {
         throw new Error('Etiqueta no encontrada');
       }

       // Update the tag
       const updatedTags = [...currentSettings.tags];
       updatedTags[tagIndex] = newName.trim();

       const updatedSettings: Settings = {
         ...currentSettings,
         tags: updatedTags,
         lastUpdated: new Date()
       };

       // Update state
       this.settingsSubject.next(updatedSettings);

       // Persist to GitHub
       return this.githubStorage.writeSettings(updatedSettings).pipe(
         map(() => newName.trim())
       );
     }

     /**
      * Delete a tag
      *
      * Requirements: 8.3, 8.4
      *
      * @param tag - The tag name to delete
      * @returns Observable<boolean> - True if deletion was successful
      * @throws Error if tag not found
      */
     deleteTag(tag: string): Observable<boolean> {
       // Get current settings
       const currentSettings = this.settingsSubject.value;
       
       // Find the tag to delete
       const tagIndex = currentSettings.tags.findIndex(
         t => t.toLowerCase() === tag.toLowerCase()
       );

       if (tagIndex === -1) {
         throw new Error('Etiqueta no encontrada');
       }

       // Remove the tag
       const updatedTags = currentSettings.tags.filter(
         (_, index) => index !== tagIndex
       );

       const updatedSettings: Settings = {
         ...currentSettings,
         tags: updatedTags,
         lastUpdated: new Date()
       };

       // Update state
       this.settingsSubject.next(updatedSettings);

       // Persist to GitHub
       return this.githubStorage.writeSettings(updatedSettings).pipe(
         map(() => true)
       );
     }

}