import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { AfterViewInit, Component, computed, effect, inject, Input, signal, ViewChild } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { DatePipe, CommonModule } from '@angular/common';
import { TasksStore } from '../../+store/tasks.store';
import { BoardsStore } from '../../+store/boards.store';

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
    DatePipe
  ]
})
export class TableComponent implements AfterViewInit {
  boardsStore = inject(BoardsStore);
  tasksStore = inject(TasksStore);

  displayedColumns: string[] = ['select', 'name', 'description', 'statusName', 'createdAt'];
  colors=["#49C4E5","#8471F2","#67E2AE","#d6d45a","#e09660","#e0635e","#de5fc7","#5d64de"]
  selection = new SelectionModel<Task>(true, []);

  @Input() tasks:Array<Task>= [];
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  // readonly unfilteredTasks = computed(() => this.tasksStore.tasks());
  readonly newTasks = computed(() => {
    const statuses = this.boardsStore.activeBoard()?.statuses ?? [];
    return this.tasks.map(task => ({
      ...task,
      statusName: statuses.find(s => s.id === task.statusId)?.name ?? task.statusId
    }));
  });

  dataSource = signal(new MatTableDataSource<Task>([]));
  statuses = this.boardsStore.activeBoard()?.statuses || [];

  isDataReady = signal(false);

  ngAfterViewInit() {
    // Assign sort after view init
    this.dataSource().sort = this.sort;
    this.dataSource().sortingDataAccessor = (item, property) => {
      if (property === 'createdAt') {
        return new Date(item.createdAt).getTime();
      }
      if (property === 'statusName') {
        return (item as any).statusName || '';
      }
      if (property === 'statusId') {
        return item.statusId;
      }
      return (item as any)[property];
    };
  }

  constructor() {
    effect(() => {
      const tasks = this.newTasks();
      this.dataSource().data = tasks;
      if (tasks.length) this.isDataReady.set(true);
    });
  }

  // ngOnInit() {
  //   this.dataSource().sort = this.sort;
  //   this.dataSource().sortingDataAccessor = (item, property) => {
  //     if (property === 'createdAt') {
  //       return new Date(item.createdAt).getTime();
  //     }
  //     if (property === 'statusId') {
  //       return item.statusId;
  //     }
  //     return (item as any)[property];
  //   };
  // }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource().filter = filterValue.trim().toLowerCase();
    this.dataSource().filterPredicate = (data, filter) =>
      data.name.toLowerCase().includes(filter) ||
      data.description.toLowerCase().includes(filter) ||
      (data.statusName?.toLowerCase().includes(filter) ?? false) ||
      (data.createdAt ? data.createdAt.toLowerCase().includes(filter) : false);
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
