import { Component, computed, inject, input, signal } from '@angular/core';
import { ColumnComponent } from "../../ui/column/column.component";
import { BoardsStore } from '../../+store/boards.store';
import { TasksStore } from '../../+store/tasks.store';
import { Task } from '../../types/task.interface';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ActiveBoardNotFoundComponent } from "../../ui/active-board-not-found/active-board-not-found.component";
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  imports: [
    ColumnComponent,
    RouterOutlet,
    RouterLink,
    ActiveBoardNotFoundComponent,
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatSelectModule
  ]
})
export class BoardComponent {
  boardsStore = inject(BoardsStore);
  tasksStore = inject(TasksStore);
  router = inject(Router);
  route = inject(ActivatedRoute);

  boardId = input.required<string>();

  // Filtering state
  searchTerm = signal('');
  selectedPerson = signal('');

  // Get all tasks
  readonly allTasks = computed(() => this.tasksStore.tasks());

  // Unique persons for dropdown
  readonly uniquePersons = computed(() => {
    const allPersons = this.allTasks().map(task => task.description).filter(Boolean);
    return Array.from(new Set(allPersons));
  });

  // Filtered tasks
  readonly filteredTasks = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const person = this.selectedPerson();
    return this.allTasks().filter(task => {
      const matchesPerson = !person || (task.description && task.description.toLowerCase() === person.toLowerCase());
      const matchesSearch =
        !search ||
        (task.name && task.name.toLowerCase().includes(search)) ||
        (task.description && task.description.toLowerCase().includes(search));
      return matchesPerson && matchesSearch;
    });
  });

  // Kanban columns, using filteredTasks
  columnsVM = computed(() => {
    const statuses = this.boardsStore.activeBoard()?.statuses || [];
    return statuses.map((status, index) => ({
      statusId: status.id,
      columnName: status.name,
      tasks: this.filteredTasks().filter(task => task.statusId === status.id),
      color: this.colors[index]
    }));
  });

  draggedTask = signal<Task | null>(null);

  onTaskClick(id: string) {
    this.tasksStore.setActiveTaskId(id);
    this.router.navigate(['task', id], { relativeTo: this.route });
  }

  colors = ["#49C4E5", "#8471F2", "#67E2AE", "#d6d45a", "#e09660", "#e0635e", "#de5fc7", "#5d64de"];

  // Filtering handlers for template
  setSearch(val: string) { this.searchTerm.set(val); }
  setPerson(val: string) { this.selectedPerson.set(val); }
}
