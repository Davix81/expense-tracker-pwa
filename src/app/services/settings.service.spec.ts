import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SettingsService } from './settings.service';
import { GitHubStorageService } from './github-storage.service';
import { Settings } from '../models/settings.model';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SettingsService - loadSettings', () => {
  let service: SettingsService;
  let githubStorageService: GitHubStorageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService, GitHubStorageService]
    });
    service = TestBed.inject(SettingsService);
    githubStorageService = TestBed.inject(GitHubStorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * Test: loadSettings should call GitHubStorageService.readSettings()
   * Requirements: 2.3
   */
  it('should call GitHubStorageService.readSettings()', () => {
    const mockSettings: Settings = {
      categories: ['Category1', 'Category2'],
      tags: ['Tag1', 'Tag2'],
      lastUpdated: new Date('2024-01-15T10:00:00.000Z')
    };

    const readSettingsSpy = vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          expect(readSettingsSpy).toHaveBeenCalledOnce();
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: loadSettings should update BehaviorSubject with loaded data
   * Requirements: 2.3
   */
  it('should update BehaviorSubject with loaded data', () => {
    const mockSettings: Settings = {
      categories: ['TestCategory1', 'TestCategory2'],
      tags: ['TestTag1', 'TestTag2'],
      lastUpdated: new Date('2024-01-15T10:00:00.000Z')
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          // Verify the settings$ observable emits the loaded data
          service.settings$.subscribe({
            next: (settings) => {
              expect(settings.categories).toEqual(['TestCategory1', 'TestCategory2']);
              expect(settings.tags).toEqual(['TestTag1', 'TestTag2']);
              expect(settings.lastUpdated).toEqual(mockSettings.lastUpdated);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: loadSettings should update categories$ observable
   * Requirements: 2.1, 2.3
   */
  it('should update categories$ observable with loaded categories', () => {
    const mockSettings: Settings = {
      categories: ['Cat1', 'Cat2', 'Cat3'],
      tags: ['Tag1'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.categories$.subscribe({
            next: (categories) => {
              expect(categories).toEqual(['Cat1', 'Cat2', 'Cat3']);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: loadSettings should update tags$ observable
   * Requirements: 2.2, 2.3
   */
  it('should update tags$ observable with loaded tags', () => {
    const mockSettings: Settings = {
      categories: ['Cat1'],
      tags: ['Tag1', 'Tag2', 'Tag3'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.tags$.subscribe({
            next: (tags) => {
              expect(tags).toEqual(['Tag1', 'Tag2', 'Tag3']);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: loadSettings should return the loaded settings
   * Requirements: 2.3
   */
  it('should return the loaded settings', () => {
    const mockSettings: Settings = {
      categories: ['Category1'],
      tags: ['Tag1'],
      lastUpdated: new Date('2024-01-15T10:00:00.000Z')
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: (settings) => {
          expect(settings).toEqual(mockSettings);
          expect(settings.categories).toEqual(['Category1']);
          expect(settings.tags).toEqual(['Tag1']);
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: loadSettings should handle errors from GitHubStorageService
   * Requirements: 11.1
   */
  it('should handle errors from GitHubStorageService', () => {
    const errorMessage = 'Failed to read settings from GitHub';
    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(
      throwError(() => new Error(errorMessage))
    );

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          reject(new Error('Should have errored'));
        },
        error: (error) => {
          expect(error.message).toBe(errorMessage);
          resolve();
        }
      });
    });
  });

  /**
   * Test: loadSettings should handle authentication errors
   * Requirements: 11.1, 11.3
   */
  it('should propagate authentication errors', () => {
    const authError = new Error('GitHub authentication failed');
    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(
      throwError(() => authError)
    );

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          reject(new Error('Should have errored'));
        },
        error: (error) => {
          expect(error.message).toContain('authentication failed');
          resolve();
        }
      });
    });
  });

  /**
   * Test: loadSettings should handle network errors
   * Requirements: 11.1, 11.4
   */
  it('should propagate network errors', () => {
    const networkError = new Error('Network connection failed');
    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(
      throwError(() => networkError)
    );

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          reject(new Error('Should have errored'));
        },
        error: (error) => {
          expect(error.message).toContain('connection failed');
          resolve();
        }
      });
    });
  });

  /**
   * Test: loadSettings should handle empty settings
   * Requirements: 2.5
   */
  it('should handle empty settings (no categories or tags)', () => {
    const emptySettings: Settings = {
      categories: [],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(emptySettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: (settings) => {
          expect(settings.categories).toEqual([]);
          expect(settings.tags).toEqual([]);
          resolve();
        },
        error: reject
      });
    });
  });
});

describe('SettingsService - validateCategory', () => {
  let service: SettingsService;
  let githubStorageService: GitHubStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService, GitHubStorageService]
    });
    service = TestBed.inject(SettingsService);
    githubStorageService = TestBed.inject(GitHubStorageService);
  });

  /**
   * Test: validateCategory should return valid for a new unique category
   * Requirements: 3.2, 3.3
   */
  it('should return valid for a new unique category', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateCategory('Assegurança');
          expect(result.valid).toBe(true);
          expect(result.errors).toEqual([]);
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateCategory should return invalid for empty category
   * Requirements: 3.2
   */
  it('should return invalid for empty category', () => {
    const result = service.validateCategory('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('La categoría no puede estar vacía');
  });

  /**
   * Test: validateCategory should return invalid for whitespace-only category
   * Requirements: 3.2
   */
  it('should return invalid for whitespace-only category', () => {
    const result = service.validateCategory('   ');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('La categoría no puede estar vacía');
  });

  /**
   * Test: validateCategory should return invalid for duplicate category (exact match)
   * Requirements: 3.3
   */
  it('should return invalid for duplicate category (exact match)', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateCategory('Subministraments');
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Ya existe una categoría con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateCategory should return invalid for duplicate category (case-insensitive)
   * Requirements: 3.3
   */
  it('should return invalid for duplicate category (case-insensitive)', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateCategory('SUBMINISTRAMENTS');
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Ya existe una categoría con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateCategory should return invalid for duplicate with extra whitespace
   * Requirements: 3.3
   */
  it('should return invalid for duplicate with extra whitespace', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateCategory('  Subministraments  ');
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Ya existe una categoría con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateCategory should allow editing same category (excludeName)
   * Requirements: 4.3, 4.4
   */
  it('should allow editing same category when excludeName is provided', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateCategory('Subministraments', 'Subministraments');
          expect(result.valid).toBe(true);
          expect(result.errors).toEqual([]);
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateCategory should allow editing to new name (excludeName)
   * Requirements: 4.3, 4.4
   */
  it('should allow editing to new name when excludeName is provided', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateCategory('Assegurança', 'Subministraments');
          expect(result.valid).toBe(true);
          expect(result.errors).toEqual([]);
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateCategory should prevent editing to duplicate name (excludeName)
   * Requirements: 4.4
   */
  it('should prevent editing to duplicate name even with excludeName', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca', 'Assegurança'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateCategory('Assegurança', 'Subministraments');
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Ya existe una categoría con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateCategory should handle excludeName with different case
   * Requirements: 4.3, 4.4
   */
  it('should handle excludeName with different case', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateCategory('SUBMINISTRAMENTS', 'subministraments');
          expect(result.valid).toBe(true);
          expect(result.errors).toEqual([]);
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateCategory should return multiple errors when applicable
   * Requirements: 3.2, 3.3
   */
  it('should return only empty error for empty string (not duplicate)', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateCategory('');
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBe(1);
          expect(result.errors).toContain('La categoría no puede estar vacía');
          resolve();
        },
        error: reject
      });
    });
  });
});

describe('SettingsService - validateTag', () => {
  let service: SettingsService;
  let githubStorageService: GitHubStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService, GitHubStorageService]
    });
    service = TestBed.inject(SettingsService);
    githubStorageService = TestBed.inject(GitHubStorageService);
  });

  /**
   * Test: validateTag should return valid for a new unique tag
   * Requirements: 6.2, 6.3
   */
  it('should return valid for a new unique tag', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateTag('Entretenimiento');
          expect(result.valid).toBe(true);
          expect(result.errors).toEqual([]);
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateTag should return invalid for empty tag
   * Requirements: 6.2
   */
  it('should return invalid for empty tag', () => {
    const result = service.validateTag('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('La etiqueta no puede estar vacía');
  });

  /**
   * Test: validateTag should return invalid for whitespace-only tag
   * Requirements: 6.2
   */
  it('should return invalid for whitespace-only tag', () => {
    const result = service.validateTag('   ');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('La etiqueta no puede estar vacía');
  });

  /**
   * Test: validateTag should return invalid for duplicate tag (exact match)
   * Requirements: 6.3
   */
  it('should return invalid for duplicate tag (exact match)', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateTag('Hogar');
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Ya existe una etiqueta con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateTag should return invalid for duplicate tag (case-insensitive)
   * Requirements: 6.3
   */
  it('should return invalid for duplicate tag (case-insensitive)', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateTag('HOGAR');
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Ya existe una etiqueta con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateTag should return invalid for duplicate with extra whitespace
   * Requirements: 6.3
   */
  it('should return invalid for duplicate with extra whitespace', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateTag('  Hogar  ');
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Ya existe una etiqueta con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateTag should allow editing same tag (excludeName)
   * Requirements: 7.3, 7.4
   */
  it('should allow editing same tag when excludeName is provided', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateTag('Hogar', 'Hogar');
          expect(result.valid).toBe(true);
          expect(result.errors).toEqual([]);
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateTag should allow editing to new name (excludeName)
   * Requirements: 7.3, 7.4
   */
  it('should allow editing to new name when excludeName is provided', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateTag('Entretenimiento', 'Hogar');
          expect(result.valid).toBe(true);
          expect(result.errors).toEqual([]);
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateTag should prevent editing to duplicate name (excludeName)
   * Requirements: 7.4
   */
  it('should prevent editing to duplicate name even with excludeName', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte', 'Entretenimiento'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateTag('Entretenimiento', 'Hogar');
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Ya existe una etiqueta con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateTag should handle excludeName with different case
   * Requirements: 7.3, 7.4
   */
  it('should handle excludeName with different case', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateTag('HOGAR', 'hogar');
          expect(result.valid).toBe(true);
          expect(result.errors).toEqual([]);
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: validateTag should return only empty error for empty string (not duplicate)
   * Requirements: 6.2, 6.3
   */
  it('should return only empty error for empty string (not duplicate)', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          const result = service.validateTag('');
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBe(1);
          expect(result.errors).toContain('La etiqueta no puede estar vacía');
          resolve();
        },
        error: reject
      });
    });
  });
});

describe('SettingsService - addCategory', () => {
  let service: SettingsService;
  let githubStorageService: GitHubStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService, GitHubStorageService]
    });
    service = TestBed.inject(SettingsService);
    githubStorageService = TestBed.inject(GitHubStorageService);
  });

  /**
   * Test: addCategory should add a new category and persist to GitHub
   * Requirements: 3.2, 3.3, 3.4, 3.5
   */
  it('should add a new category and persist to GitHub', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.addCategory('Assegurança').subscribe({
            next: (result) => {
              expect(result).toBe('Assegurança');
              expect(writeSettingsSpy).toHaveBeenCalledOnce();
              
              // Verify the settings were updated
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.categories).toContain('Assegurança');
              expect(writtenSettings.categories.length).toBe(2);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: addCategory should trim whitespace from category name
   * Requirements: 3.2, 3.4
   */
  it('should trim whitespace from category name', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.addCategory('  Assegurança  ').subscribe({
            next: (result) => {
              expect(result).toBe('Assegurança');
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.categories).toContain('Assegurança');
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: addCategory should throw error for empty category
   * Requirements: 3.2, 3.6
   */
  it('should throw error for empty category', () => {
    expect(() => service.addCategory('')).toThrow('La categoría no puede estar vacía');
  });

  /**
   * Test: addCategory should throw error for duplicate category
   * Requirements: 3.3, 3.6
   */
  it('should throw error for duplicate category', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          expect(() => service.addCategory('Subministraments')).toThrow('Ya existe una categoría con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: addCategory should update the BehaviorSubject
   * Requirements: 3.4, 3.5
   */
  it('should update the BehaviorSubject with new category', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.addCategory('Assegurança').subscribe({
            next: () => {
              service.categories$.subscribe({
                next: (categories) => {
                  expect(categories).toContain('Assegurança');
                  expect(categories.length).toBe(2);
                  resolve();
                },
                error: reject
              });
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });
});

describe('SettingsService - updateCategory', () => {
  let service: SettingsService;
  let githubStorageService: GitHubStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService, GitHubStorageService]
    });
    service = TestBed.inject(SettingsService);
    githubStorageService = TestBed.inject(GitHubStorageService);
  });

  /**
   * Test: updateCategory should update an existing category and persist to GitHub
   * Requirements: 4.3, 4.4, 4.5, 4.6
   */
  it('should update an existing category and persist to GitHub', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.updateCategory('Subministraments', 'Assegurança').subscribe({
            next: (result) => {
              expect(result).toBe('Assegurança');
              expect(writeSettingsSpy).toHaveBeenCalledOnce();
              
              // Verify the settings were updated
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.categories).toContain('Assegurança');
              expect(writtenSettings.categories).not.toContain('Subministraments');
              expect(writtenSettings.categories.length).toBe(2);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateCategory should handle case-insensitive matching for oldName
   * Requirements: 4.5
   */
  it('should handle case-insensitive matching for oldName', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.updateCategory('SUBMINISTRAMENTS', 'Assegurança').subscribe({
            next: (result) => {
              expect(result).toBe('Assegurança');
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.categories).toContain('Assegurança');
              expect(writtenSettings.categories).not.toContain('Subministraments');
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateCategory should trim whitespace from new category name
   * Requirements: 4.3, 4.5
   */
  it('should trim whitespace from new category name', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.updateCategory('Subministraments', '  Assegurança  ').subscribe({
            next: (result) => {
              expect(result).toBe('Assegurança');
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.categories).toContain('Assegurança');
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateCategory should throw error for empty new category name
   * Requirements: 4.3, 4.7
   */
  it('should throw error for empty new category name', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          expect(() => service.updateCategory('Subministraments', '')).toThrow('La categoría no puede estar vacía');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateCategory should throw error for duplicate new category name
   * Requirements: 4.4, 4.7
   */
  it('should throw error for duplicate new category name', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          expect(() => service.updateCategory('Subministraments', 'Lloguer/Hipoteca')).toThrow('Ya existe una categoría con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateCategory should throw error if category not found
   * Requirements: 4.5
   */
  it('should throw error if category not found', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          expect(() => service.updateCategory('NonExistent', 'NewName')).toThrow('Categoría no encontrada');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateCategory should update the BehaviorSubject
   * Requirements: 4.5, 4.6
   */
  it('should update the BehaviorSubject with updated category', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.updateCategory('Subministraments', 'Assegurança').subscribe({
            next: () => {
              service.categories$.subscribe({
                next: (categories) => {
                  expect(categories).toContain('Assegurança');
                  expect(categories).not.toContain('Subministraments');
                  expect(categories.length).toBe(2);
                  resolve();
                },
                error: reject
              });
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });
});

describe('SettingsService - deleteCategory', () => {
  let service: SettingsService;
  let githubStorageService: GitHubStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService, GitHubStorageService]
    });
    service = TestBed.inject(SettingsService);
    githubStorageService = TestBed.inject(GitHubStorageService);
  });

  /**
   * Test: deleteCategory should delete a category and persist to GitHub
   * Requirements: 5.3, 5.4
   */
  it('should delete a category and persist to GitHub', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca', 'Assegurança'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.deleteCategory('Subministraments').subscribe({
            next: (result) => {
              expect(result).toBe(true);
              expect(writeSettingsSpy).toHaveBeenCalledOnce();
              
              // Verify the settings were updated
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.categories).not.toContain('Subministraments');
              expect(writtenSettings.categories.length).toBe(2);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: deleteCategory should handle case-insensitive matching
   * Requirements: 5.3
   */
  it('should handle case-insensitive matching for category name', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.deleteCategory('SUBMINISTRAMENTS').subscribe({
            next: (result) => {
              expect(result).toBe(true);
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.categories).not.toContain('Subministraments');
              expect(writtenSettings.categories.length).toBe(1);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: deleteCategory should throw error if category not found
   * Requirements: 5.3
   */
  it('should throw error if category not found', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          expect(() => service.deleteCategory('NonExistent')).toThrow('Categoría no encontrada');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: deleteCategory should update the BehaviorSubject
   * Requirements: 5.3, 5.4
   */
  it('should update the BehaviorSubject after deletion', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments', 'Lloguer/Hipoteca'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.deleteCategory('Subministraments').subscribe({
            next: () => {
              service.categories$.subscribe({
                next: (categories) => {
                  expect(categories).not.toContain('Subministraments');
                  expect(categories.length).toBe(1);
                  resolve();
                },
                error: reject
              });
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: deleteCategory should handle deleting the last category
   * Requirements: 5.3, 5.4
   */
  it('should handle deleting the last category', () => {
    const mockSettings: Settings = {
      categories: ['Subministraments'],
      tags: [],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.deleteCategory('Subministraments').subscribe({
            next: (result) => {
              expect(result).toBe(true);
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.categories).toEqual([]);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });
});

describe('SettingsService - addTag', () => {
  let service: SettingsService;
  let githubStorageService: GitHubStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService, GitHubStorageService]
    });
    service = TestBed.inject(SettingsService);
    githubStorageService = TestBed.inject(GitHubStorageService);
  });

  /**
   * Test: addTag should add a new tag and persist to GitHub
   * Requirements: 6.2, 6.3, 6.4, 6.5
   */
  it('should add a new tag and persist to GitHub', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.addTag('Transporte').subscribe({
            next: (result) => {
              expect(result).toBe('Transporte');
              expect(writeSettingsSpy).toHaveBeenCalledOnce();
              
              // Verify the settings were updated
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.tags).toContain('Transporte');
              expect(writtenSettings.tags.length).toBe(2);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: addTag should trim whitespace from tag name
   * Requirements: 6.2, 6.4
   */
  it('should trim whitespace from tag name', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.addTag('  Transporte  ').subscribe({
            next: (result) => {
              expect(result).toBe('Transporte');
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.tags).toContain('Transporte');
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: addTag should throw error for empty tag
   * Requirements: 6.2, 6.6
   */
  it('should throw error for empty tag', () => {
    expect(() => service.addTag('')).toThrow('La etiqueta no puede estar vacía');
  });

  /**
   * Test: addTag should throw error for duplicate tag
   * Requirements: 6.3, 6.6
   */
  it('should throw error for duplicate tag', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          expect(() => service.addTag('Hogar')).toThrow('Ya existe una etiqueta con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: addTag should update the BehaviorSubject
   * Requirements: 6.4, 6.5
   */
  it('should update the BehaviorSubject with new tag', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.addTag('Transporte').subscribe({
            next: () => {
              service.tags$.subscribe({
                next: (tags) => {
                  expect(tags).toContain('Transporte');
                  expect(tags.length).toBe(2);
                  resolve();
                },
                error: reject
              });
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });
});

describe('SettingsService - updateTag', () => {
  let service: SettingsService;
  let githubStorageService: GitHubStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService, GitHubStorageService]
    });
    service = TestBed.inject(SettingsService);
    githubStorageService = TestBed.inject(GitHubStorageService);
  });

  /**
   * Test: updateTag should update an existing tag and persist to GitHub
   * Requirements: 7.3, 7.4, 7.5, 7.6
   */
  it('should update an existing tag and persist to GitHub', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.updateTag('Hogar', 'Entretenimiento').subscribe({
            next: (result) => {
              expect(result).toBe('Entretenimiento');
              expect(writeSettingsSpy).toHaveBeenCalledOnce();
              
              // Verify the settings were updated
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.tags).toContain('Entretenimiento');
              expect(writtenSettings.tags).not.toContain('Hogar');
              expect(writtenSettings.tags.length).toBe(2);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateTag should handle case-insensitive matching for oldName
   * Requirements: 7.5
   */
  it('should handle case-insensitive matching for oldName', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.updateTag('HOGAR', 'Entretenimiento').subscribe({
            next: (result) => {
              expect(result).toBe('Entretenimiento');
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.tags).toContain('Entretenimiento');
              expect(writtenSettings.tags).not.toContain('Hogar');
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateTag should trim whitespace from new tag name
   * Requirements: 7.3, 7.5
   */
  it('should trim whitespace from new tag name', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.updateTag('Hogar', '  Entretenimiento  ').subscribe({
            next: (result) => {
              expect(result).toBe('Entretenimiento');
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.tags).toContain('Entretenimiento');
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateTag should throw error for empty new tag name
   * Requirements: 7.3, 7.7
   */
  it('should throw error for empty new tag name', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          expect(() => service.updateTag('Hogar', '')).toThrow('La etiqueta no puede estar vacía');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateTag should throw error for duplicate new tag name
   * Requirements: 7.4, 7.7
   */
  it('should throw error for duplicate new tag name', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          expect(() => service.updateTag('Hogar', 'Transporte')).toThrow('Ya existe una etiqueta con este nombre');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateTag should throw error if tag not found
   * Requirements: 7.5
   */
  it('should throw error if tag not found', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          expect(() => service.updateTag('NonExistent', 'NewName')).toThrow('Etiqueta no encontrada');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: updateTag should update the BehaviorSubject
   * Requirements: 7.5, 7.6
   */
  it('should update the BehaviorSubject with updated tag', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.updateTag('Hogar', 'Entretenimiento').subscribe({
            next: () => {
              service.tags$.subscribe({
                next: (tags) => {
                  expect(tags).toContain('Entretenimiento');
                  expect(tags).not.toContain('Hogar');
                  expect(tags.length).toBe(2);
                  resolve();
                },
                error: reject
              });
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });
});

describe('SettingsService - deleteTag', () => {
  let service: SettingsService;
  let githubStorageService: GitHubStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService, GitHubStorageService]
    });
    service = TestBed.inject(SettingsService);
    githubStorageService = TestBed.inject(GitHubStorageService);
  });

  /**
   * Test: deleteTag should delete a tag and persist to GitHub
   * Requirements: 8.3, 8.4
   */
  it('should delete a tag and persist to GitHub', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte', 'Entretenimiento'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.deleteTag('Hogar').subscribe({
            next: (result) => {
              expect(result).toBe(true);
              expect(writeSettingsSpy).toHaveBeenCalledOnce();
              
              // Verify the settings were updated
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.tags).not.toContain('Hogar');
              expect(writtenSettings.tags.length).toBe(2);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: deleteTag should handle case-insensitive matching
   * Requirements: 8.3
   */
  it('should handle case-insensitive matching for tag name', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.deleteTag('HOGAR').subscribe({
            next: (result) => {
              expect(result).toBe(true);
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.tags).not.toContain('Hogar');
              expect(writtenSettings.tags.length).toBe(1);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: deleteTag should throw error if tag not found
   * Requirements: 8.3
   */
  it('should throw error if tag not found', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          expect(() => service.deleteTag('NonExistent')).toThrow('Etiqueta no encontrada');
          resolve();
        },
        error: reject
      });
    });
  });

  /**
   * Test: deleteTag should update the BehaviorSubject
   * Requirements: 8.3, 8.4
   */
  it('should update the BehaviorSubject after deletion', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar', 'Transporte'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.deleteTag('Hogar').subscribe({
            next: () => {
              service.tags$.subscribe({
                next: (tags) => {
                  expect(tags).not.toContain('Hogar');
                  expect(tags.length).toBe(1);
                  resolve();
                },
                error: reject
              });
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });

  /**
   * Test: deleteTag should handle deleting the last tag
   * Requirements: 8.3, 8.4
   */
  it('should handle deleting the last tag', () => {
    const mockSettings: Settings = {
      categories: [],
      tags: ['Hogar'],
      lastUpdated: new Date()
    };

    vi.spyOn(githubStorageService, 'readSettings').mockReturnValue(of(mockSettings));
    const writeSettingsSpy = vi.spyOn(githubStorageService, 'writeSettings').mockReturnValue(of(undefined));

    return new Promise<void>((resolve, reject) => {
      service.loadSettings().subscribe({
        next: () => {
          service.deleteTag('Hogar').subscribe({
            next: (result) => {
              expect(result).toBe(true);
              const writtenSettings = writeSettingsSpy.mock.calls[0][0];
              expect(writtenSettings.tags).toEqual([]);
              resolve();
            },
            error: reject
          });
        },
        error: reject
      });
    });
  });
});
