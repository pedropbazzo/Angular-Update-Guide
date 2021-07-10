import { Component } from '@angular/core';
import snarkdown from 'snarkdown';
import { Step, RECOMMENDATIONS } from './recommendations';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'Angular Update Guide';

  level = 1;
  options = {
    ngUpgrade: false,
  };
  optionList = [
    { id: 'ngUpgrade', name: 'ngUpgrade', description: 'for using AngularJS and Angular at the same time' },
    { id: 'material', name: 'Angular Material', description: '' },
  ];
  packageManager: 'npm install' | 'yarn add' = 'npm install';

  beforeRecommendations: Step[] = [];
  duringRecommendations: Step[] = [];
  afterRecommendations: Step[] = [];


  versions = [
    { name: '2.0', number: 200 },
    { name: '2.1', number: 201 },
    { name: '2.2', number: 202 },
    { name: '2.3', number: 203 },
    { name: '2.4', number: 204 },
    { name: '4.0', number: 400 },
    { name: '4.1', number: 410 },
    { name: '4.2', number: 420 },
    { name: '4.3', number: 430 },
    { name: '4.4', number: 440 },
    { name: '5.0', number: 500 },
    { name: '5.1', number: 510 },
    { name: '5.2', number: 520 },
    { name: '6.0', number: 600 },
    { name: '6.1', number: 610 },
    { name: '7.0', number: 700 },
    { name: '7.1', number: 710 },
    { name: '7.2', number: 720 },
    { name: '8.0', number: 800 },
    { name: '9.0', number: 900 },
  ];
  from = this.versions[15];
  to = this.versions[18];

  steps: Step[] = RECOMMENDATIONS;

  constructor(public location: Location) {

    if(location.path() !== '') {
      const [from,to] = location.path().split(':');
      console.log(from,to);
      this.from = this.versions.find(version => version.name === from);
      this.to = this.versions.find(version => version.name === to);
      this.showUpdatePath();
    }
    
  }

  showUpdatePath() {
    this.beforeRecommendations = [];
    this.duringRecommendations = [];
    this.afterRecommendations = [];

    this.title = `Angular Update Guide | ${this.from.name} -> ${this.to.name} for ${
      this.level < 2 ? 'Basic' : this.level < 3 ? 'Medium' : 'Advanced'
    } Apps`;

    // Find applicable steps and organize them into before, during, and after upgrade
    for (const step of this.steps) {
      if (step.level <= this.level && step.necessaryAsOf > this.from.number) {
        // Check Options
        // Only show steps that don't have a required option
        // Or when the user has a matching option selected
        let skip = false;
        for (const option of this.optionList) {
          if (step[option.id] && !this.options[option.id]) {
            skip = true;
          }
        }
        if (skip) {
          continue;
        }

        // Render and replace variables
        step.renderedStep = snarkdown(this.replaceVariables(step.action));

        // If you could do it before now, but didn't have to finish it before now
        if (step.possibleIn <= this.from.number && step.necessaryAsOf >= this.from.number) {
          this.beforeRecommendations.push(step);
          // If you couldn't do it before now, and you must do it now
        } else if (step.possibleIn > this.from.number && step.necessaryAsOf <= this.to.number) {
          this.duringRecommendations.push(step);
        } else if (step.possibleIn <= this.to.number) {
          this.afterRecommendations.push(step);
        } else {
        }
      }
      

      // Update the URL so users can link to this transition
      this.location.replaceState(`${this.from.name}:${this.to.name}`);
    }

    // Tell everyone how to upgrade for v6 or earlier
    this.renderPreV6Instructions();
  }

  getAdditionalDependencies(version: number) {
    if (version < 500) {
      return `typescript@'>=2.1.0 <2.4.0'`;
    } else if (version < 600) {
      return `typescript@2.4.2 rxjs@^5.5.2`;
    } else {
      return `typescript@2.7.x rxjs@^6.0.0`;
    }
  }
  getAngularVersion(version: number) {
    if (version < 400) {
      return `'^2.0.0'`;
    } else {
      const major = Math.floor(version / 100);
      const minor = Math.floor((version - major * 100) / 10);
      return `^${major}.${minor}.0`;
    }
  }

  renderPreV6Instructions() {
    let upgradeStep;
    const isWindows = /win/i.test(navigator.platform);
    const additionalDeps = this.getAdditionalDependencies(this.to.number);
    const angularVersion = this.getAngularVersion(this.to.number);
    const angularPackages = [
      'animations',
      'common',
      'compiler',
      'compiler-cli',
      'core',
      'forms',
      'http',
      'platform-browser',
      'platform-browser-dynamic',
      'platform-server',
      'router',
    ];

    // Provide npm/yarn instructions for versions before 6
    if (this.to.number < 600) {
      const actionMessage = `Update all of your dependencies to the latest Angular and the right version of TypeScript.`;

      if (isWindows) {
        const packages =
          angularPackages.map(packageName => `@angular/${packageName}@${angularVersion}`).join(' ') +
          ' ' +
          additionalDeps;

        upgradeStep = {
          step: 'General Update',
          action: `${actionMessage}
          If you are using Windows, you can use:

\`${this.packageManager} ${packages}\``,
        };
      } else {
        const packages = `@angular/{${angularPackages.join(',')}}@${angularVersion} ${additionalDeps}`;
        upgradeStep = {
          step: 'General update',
          action: `${actionMessage}
          If you are using Linux/Mac, you can use:

\`${this.packageManager} ${packages}\``,
        };
      }

      // Npm installs typescript wrong in v5, let's manually specify
      // https://github.com/npm/npm/issues/16813
      if (this.packageManager === 'npm install' && this.to.number === 500) {
        upgradeStep.action += `

\`npm install typescript@2.4.2 --save-exact\``;
      }

      upgradeStep.renderedStep = snarkdown(upgradeStep.action);

      this.duringRecommendations.push(upgradeStep);
    }
  }

  replaceVariables(action: string) {
    let newAction = action;
    newAction = newAction.replace(
      '${packageManagerGlobalInstall}',
      this.packageManager === 'npm install' ? 'npm install -g' : 'yarn global add'
    );
    newAction = newAction.replace('${packageManagerInstall}', this.packageManager);
    return newAction;
  }

  getVersion(newVersion: string) {
    return this.versions.find(version => version.name === newVersion);
  }
  log(x) {
    console.log(x);
    return x;
  }
}
