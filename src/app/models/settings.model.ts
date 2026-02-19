/**
 * Interfaz para la configuración de categorías y etiquetas
 */
export interface Settings {
  /** Lista de categorías disponibles */
  categories: string[];
  
  /** Lista de etiquetas disponibles */
  tags: string[];
  
  /** Timestamp de última actualización */
  lastUpdated: Date;
}

/**
 * Resultado de validación para operaciones de configuración
 */
export interface SettingsValidationResult {
  valid: boolean;
  errors: string[];
}
