import { Component, OnInit } from '@angular/core';
import { ContractoService } from '../../../services/contracto/contracto.service';

@Component({
  selector: 'app-lista-contratos',
  templateUrl: './lista-contratos.component.html',
  styleUrls: ['./lista-contratos.component.css']
})
export class ListaContratosComponent implements OnInit {
  contratos: any[] = [];
  cargando = false;

  constructor(private contratoService: ContractoService) { }

  ngOnInit(): void {
    this.cargarContratos();
  }

  cargarContratos(): void {
    this.cargando = true;
    this.contratoService.getContratos().subscribe({
      next: (data) => {
        this.contratos = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar contratos:', error);
        this.cargando = false;
      }
    });
  }

  // Otros métodos...
}