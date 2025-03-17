import { Component, Input, OnInit } from '@angular/core';
import { ContractoService } from '../../../services/contracto/contracto.service';

@Component({
  selector: 'app-lista-contratos',
  templateUrl: './lista-contratos.component.html',
  styleUrls: ['./lista-contratos.component.css']
})
export class ListaContratosComponent implements OnInit {
  @Input() contratos: any[] = [];
  cargando = false;
  terminoBusqueda = '';
  contratosFiltrados: any[] = [];

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

  filtrarPorEstado(estado: string): any[] {
    if (!this.contratos) return [];
    
    return this.contratos.filter(contrato => {
      const fechaActual = new Date();
      const fechaVencimiento = new Date(contrato.fechaVencimiento);
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (estado) {
        case 'Activo':
          return diasRestantes > 30;
        case 'Por vencer':
          return diasRestantes <= 30 && diasRestantes > 0;
        case 'Vencido':
          return diasRestantes <= 0;
        default:
          return false;
      }
    });
  }
}