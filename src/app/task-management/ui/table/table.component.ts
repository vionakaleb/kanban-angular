import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { AfterViewInit, ChangeDetectorRef, Component, computed, effect, inject, Input, signal, ViewChild } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { DatePipe, CommonModule } from '@angular/common';
import { TasksStore } from '../../+store/tasks.store';
import { BoardsStore } from '../../+store/boards.store';
import { MatSelectModule } from '@angular/material/select';

export interface Task {
  id: string;
  name: string;
  description: string;
  subtasks: any[];
  boardId: string;
  statusId: string;
  statusName?: string;
  createdAt: string;
}

type StatusId =
  | 'd1fbf2ff-b14c-4d6f-95f1-664dafe167b9'
  | '366869be-4f7d-4469-8b7f-8291f1dbecb3'
  | '8bb72d66-d8e1-478d-9db1-4325c35bf9a3';

@Component({
  selector: 'app-table',
  styleUrls: ['table.component.scss'],
  templateUrl: 'table.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatSelectModule,
    DatePipe
  ]
})
export class TableComponent implements AfterViewInit {
  boardsStore = inject(BoardsStore);
  tasksStore = inject(TasksStore);

  displayedColumns: string[] = ['select', 'name', 'description', 'statusName', 'createdAt'];
  selection = new SelectionModel<Task>(true, []);

  searchTerm: string = '';
  selectedPerson: string = '';

  @Input() tasks: Array<Task> = [];
  @ViewChild(MatSort, { static: false }) sort!: MatSort;  // static: false is safer with signals

  readonly newTasks = computed(() => {
    const statuses = this.boardsStore.activeBoard()?.statuses ?? [];
    return this.tasks.map(task => ({
      ...task,
      statusName: statuses.find(s => s.id === task.statusId)?.name ?? task.statusId
    }));
  });

  readonly uniquePersons = computed(() => {
    // this.newTasks() is your enriched tasks array
    const allPersons = this.newTasks().map(task => task.description).filter(Boolean);
    // Remove duplicates
    return Array.from(new Set(allPersons));
  });

  dataSource = signal(new MatTableDataSource<Task>([]));
  isDataReady = signal(false);

  constructor(private cdr: ChangeDetectorRef) {
    // Use effect to update data, sort, and change detection
    effect(() => {
      const tasks = this.newTasks();
      const ds = this.dataSource();
      ds.data = tasks;
      if (this.sort) {
        ds.sort = this.sort;
        ds.sortingDataAccessor = (item, property) => {
          if (property === 'createdAt') {
            return new Date(item.createdAt).getTime();
          }
          if (property === 'statusName') {
            return item.statusName || '';
          }
          if (property === 'statusId') {
            return item.statusId;
          }
          return (item as any)[property];
        };
      }
      ds._updateChangeSubscription();
      this.isDataReady.set(tasks.length > 0);
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit() {
    // Assign sort when the view is ready and sort exists
    if (this.dataSource() && this.sort) {
      this.dataSource().sort = this.sort;
      // Optionally update the subscription here too
      this.dataSource()._updateChangeSubscription();
      this.cdr.detectChanges(); // force re-render for matSort
    }
  }

  applyFilter(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.compositeFilter();
  }

  filterByPerson(person: string) {
    this.selectedPerson = person;
    this.compositeFilter();
  }

  compositeFilter() {
    this.dataSource().filter = JSON.stringify({
      search: this.searchTerm,
      person: this.selectedPerson
    });

    this.dataSource().filterPredicate = (data, filterString) => {
      const filter = JSON.parse(filterString);
      const matchesPerson =
        !filter.person ||
        data.description.toLowerCase() === filter.person.toLowerCase();
      const matchesSearch =
        !filter.search ||
        data.name.toLowerCase().includes(filter.search) ||
        data.description.toLowerCase().includes(filter.search) ||
        (data.statusName?.toLowerCase().includes(filter.search) ?? false) ||
        (data.createdAt ? data.createdAt.toLowerCase().includes(filter.search) : false);

      return matchesPerson && matchesSearch;
    };
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource().data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource().data.forEach(row => this.selection.select(row));
  }

  checkboxLabel(row?: Task): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.name}`;
  }
}
