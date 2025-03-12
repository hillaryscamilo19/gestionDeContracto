import { Component, OnInit } from '@angular/core';
import { ContractoService } from '../../../services/contracto/contracto.service';
import { ContractModule } from '../../../models/contract/contract.module';

@Component({
  selector: 'app-lista-contratos',
  templateUrl: './lista-contratos.component.html',
  styleUrls: ['./lista-contratos.component.css']
})
export class ListaContratosComponent implements OnInit {
  contratos: ContractModule[] = [];
  cargando = true;
  error = '';

  constructor(private contratoService: ContractoService) { }

  ngOnInit(): void {
    this.cargarContratos();
  }

  cargarContratos(): void {
    this.cargando = true;
    this.contratoService.getContratos().subscribe(
      (data) => {
        this.contratos = data;
        this.cargando = false;
      },
      (error) => {
        this.error = 'Error al cargar contratos';
        this.cargando = false;
        console.error(error);
      }
    );
  }

  eliminarContrato(id: string): void {
    if (confirm('¿Está seguro de eliminar este contrato?')) {
      this.contratoService.eliminarContrato(id).subscribe(
        () => {

        },
        (error) => {
          console.error('Error al eliminar contrato:', error);
          alert('Error al eliminar contrato');
        }
      );
    }
  }

  calcularEstado(fechaVencimiento: Date): string {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return 'Vencido';
    } else if (diasRestantes <= 30) {
      return 'Próximo a vencer';
    } else {
      return 'Activo';
    }
  }

  getClaseEstado(estado: string): string {
    switch (estado) {
      case 'Vencido': return 'estado-vencido';
      case 'Próximo a vencer': return 'estado-proximo';
      case 'Activo': return 'estado-activo';
      default: return '';
    }
  }
}
