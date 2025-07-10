import { Injectable } from '@angular/core';
export type ColorTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ColorThemeService {
  colorTheme: ColorTheme = 'light';

  constructor(){
    this.getTheme();
  }

  setTheme(){
    localStorage.setItem("colorTheme", 'dark')
  }

  getTheme(){
    const localSotrageTheme = localStorage['colorTheme'];
    if (localSotrageTheme === 'light' || localSotrageTheme === 'dark') {
      this.colorTheme = localSotrageTheme;
    } else {
      this.colorTheme = 'light';
    }
    document.documentElement.setAttribute('data-theme', this.colorTheme);
  }

}
