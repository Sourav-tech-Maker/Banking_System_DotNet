import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">App Settings</h1>
        <p class="mt-1 text-sm text-slate-500">Configure application display and preferences</p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-6">
        <!-- Display Preference -->
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Dark Mode</h3>
            <p class="text-xs text-slate-500 mt-1">Switch to dark display theme (for night comfort)</p>
          </div>
          <button
            type="button"
            (click)="toggleDarkMode()"
            [ngClass]="settings.darkMode ? 'bg-indigo-600' : 'bg-slate-200'"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
          >
            <span
              [ngClass]="settings.darkMode ? 'translate-x-5' : 'translate-x-0'"
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            ></span>
          </button>
        </div>

        <!-- Language preference -->
        <div class="border-t border-slate-100 pt-5 flex items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Display Language</h3>
            <p class="text-xs text-slate-500 mt-1">Select your preferred system language</p>
          </div>
          <select
            [(ngModel)]="settings.lang"
            (change)="saveSettings()"
            class="block rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none bg-white min-w-[120px]"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </div>
    </div>
  `
})
export class SettingsViewComponent implements OnInit {
  @Output() onThemeChange = new EventEmitter<boolean>();

  protected settings = {
    darkMode: false,
    lang: 'en'
  };

  ngOnInit() {
    this.loadSettings();
  }

  private loadSettings() {
    const saved = localStorage.getItem('yono_settings');
    if (saved) {
      try {
        this.settings = JSON.parse(saved);
      } catch {
        // ignore
      }
    }
  }

  protected toggleDarkMode() {
    this.settings.darkMode = !this.settings.darkMode;
    this.saveSettings();
    this.onThemeChange.emit(this.settings.darkMode);
  }

  protected saveSettings() {
    localStorage.setItem('yono_settings', JSON.stringify(this.settings));
    localStorage.setItem('yono_theme', this.settings.darkMode ? 'dark' : 'light');
    if (this.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
