import { Component, computed, inject, input, Input, signal } from '@angular/core';
import { ColumnComponent } from "../../ui/column/column.component";
import { BoardsStore } from '../../+store/boards.store';
import { TasksStore } from '../../+store/tasks.store';
import { Task } from '../../types/task.interface';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { ActiveBoardNotFoundComponent } from "../../ui/active-board-not-found/active-board-not-found.component";
import { TableComponent } from '../../ui/table/table.component';

@Component({
  selector: 'app-board-table',
  templateUrl: './board-table.component.html',
  styleUrls: ['./board-table.component.scss'],
  imports: [RouterOutlet, RouterLink, ActiveBoardNotFoundComponent, TableComponent]
})
export class BoardTableComponent {
  boardsStore = inject(BoardsStore);
  tasksStore = inject(TasksStore);
  router = inject(Router);
  route = inject(ActivatedRoute);
  tasks = computed(() => this.tasksStore.tasks());

  boardId = input.required<string>();

  columnsVM = computed(() => {
    const statuses = this.boardsStore.activeBoard()?.statuses || [];
    return statuses.map((status, index) => ({
      statusId: status.id,
      columnName: status.name,
      tasks: this.tasksStore.tasks().filter(task => task.statusId === status.id),
      color: this.colors[index]
    }))
  })
  draggedTask = signal<Task | null>(null);

  onTaskClick(id: string) {
    this.tasksStore.setActiveTaskId(id);
    this.router.navigate(['task', id], { relativeTo: this.route });
  }

  colors = ["#49C4E5", "#8471F2", "#67E2AE", "#d6d45a", "#e09660", "#e0635e", "#de5fc7", "#5d64de"]
}
