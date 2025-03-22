// lista-contratos.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ContractoService } from '../../../services/contracto/contracto.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ClienteService } from 'src/app/services/Cliente/cliente.service';

@Component({
  selector: 'app-lista-contratos',
  templateUrl: './lista-contratos.component.html',
  styleUrls: ['./lista-contratos.component.css']
})
export class ListaContratosComponent implements OnInit {
  @Input() contratos: any[] = [];
  @Input() cargando: boolean = false;
  filteredContratos: any[] = [];
  allClients: any[] = [];
  searchTerm: string = '';
  filterType: string = 'all';
  filteredClients: any[] = [];
  loading: boolean = true;
  filterForm: FormGroup;
  
  // Opciones de filtro
  filterOptions = [
    { value: 'all', label: 'Todos los contratos' },
    { value: 'active', label: 'Contratos activos' },
    { value: 'expiring', label: 'Contratos por vencer' },
    { value: 'expired', label: 'Contratos vencidos' }
  ];
  
  // Opciones de ordenamiento
  sortOptions = [
    { value: 'clientAsc', label: 'Cliente (A-Z)' },
    { value: 'clientDesc', label: 'Cliente (Z-A)' },
    { value: 'dateAsc', label: 'Fecha de vencimiento (Antigua-Nueva)' },
    { value: 'dateDesc', label: 'Fecha de vencimiento (Nueva-Antigua)' }
  ];

  constructor(
    private contratoService: ContractoService,
        private clientService: ClienteService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      filterType: ['all'],
      sortBy: ['dateDesc']
    });
  }

  ngOnInit(): void {
    this.loadContratos();
    this.loadClients()
    // Aplicar filtros cuando cambian los valores del formulario
    this.filterForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => this.filterContratos());
      
    this.filterForm.get('filterType')?.valueChanges.subscribe(() => this.filterContratos());
    this.filterForm.get('sortBy')?.valueChanges.subscribe(() => this.filterContratos());
  }
  
  loadClients(): void {
    this.loading = true;
    this.clientService.getClients().subscribe({
      next: (data) => {
        this.allClients = data;
        this.applyFilters(); 
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar clientes:', error);
        this.loading = false;
      }
    });
  }
  loadContratos(): void {
    this.loading = true;
    this.contratoService.getContratos().subscribe({
      next: (data: any[]) => {
        this.contratos = data;
        this.filterContratos();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar contratos:', error);
        this.loading = false;
      }
    });
  }

  filterContratos(): void {
    const searchTerm = this.filterForm.get('searchTerm')?.value?.toLowerCase() || '';
    const filterType = this.filterForm.get('filterType')?.value || 'all';
    const sortBy = this.filterForm.get('sortBy')?.value || 'dateDesc';

    let filtered = this.contratos.filter(contrato => 
      (contrato.clientName || contrato.clienteNombre || '').toLowerCase().includes(searchTerm) ||
      (contrato.description || contrato.descripcion || '').toLowerCase().includes(searchTerm) ||
      (contrato.numeroContrato || '').toLowerCase().includes(searchTerm)
    );
    if (filterType === 'active') {
      filtered = this.filtrarPorEstado('Activo');
    } else if (filterType === 'expiring') {
      filtered = this.filtrarPorEstado('Por vencer');
    } else if (filterType === 'expired') {
      filtered = this.filtrarPorEstado('Vencido');
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'clientAsc':
          return (a.clientName || a.clienteNombre || '').localeCompare(b.clientName || b.clienteNombre || '');
        case 'clientDesc':
          return (b.clientName || b.clienteNombre || '').localeCompare(a.clientName || a.clienteNombre || '');
        case 'dateAsc':
          const dateA = a.expirationDate || a.fechaVencimiento;
          const dateB = b.expirationDate || b.fechaVencimiento;
          return dateA && dateB ? new Date(dateA).getTime() - new Date(dateB).getTime() : 0;
        case 'dateDesc':
          const dateC = a.expirationDate || a.fechaVencimiento;
          const dateD = b.expirationDate || b.fechaVencimiento;
          return dateC && dateD ? new Date(dateD).getTime() - new Date(dateC).getTime() : 0;
        default:
          return 0;
      }
    });
    
    this.filteredContratos = filtered;
  }

  applyFilters(): void {
    // Filtrar por término de búsqueda
    let result = this.allClients;
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(client => 
        (client.name || '').toLowerCase().includes(term) ||
        (client.email || '').toLowerCase().includes(term) ||
        (client.phone || '').toLowerCase().includes(term)
      );
    }
    
    // Filtrar por tipo
    if (this.filterType !== 'all') {
      if (this.filterType === 'active') {
        result = result.filter(client => client.hasActiveContracts);
      } else if (this.filterType === 'inactive') {
        result = result.filter(client => !client.hasActiveContracts);
      } else if (this.filterType === 'recent') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        result = result.filter(client => {
          if (!client.createdAt) return false;
          const createdAt = new Date(client.createdAt);
          return createdAt >= thirtyDaysAgo;
        });
      }
    }
    
    this.filteredClients = result;
  }
  

  filtrarPorEstado(estado: string): any[] {
    if (!this.contratos) {
      return [];
    }
    
    return this.contratos.filter(contrato => {
      const estadoContrato = this.getEstadoTexto(contrato);
      return estadoContrato === estado;
    });
  }

  getEstadoTexto(contrato: any): string {
    try {
      const hoy = new Date();
      const fechaVencimientoStr = contrato.fechaVencimiento || contrato.expirationDate;
      if (!fechaVencimientoStr) {
        return "Desconocido";
      }
      
      const fechaVencimiento = new Date(fechaVencimientoStr);
      const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes < 0) {
        return "Vencido";
      } else if (diasRestantes <= 30) {
        return "Por vencer";
      } else {
        return "Activo";
      }
    } catch (error) {
      console.error("Error al calcular estado del contrato:", error, contrato);
      return "Desconocido";
    }
  }

  getEstadoClase(contrato: any): string {
    const estado = this.getEstadoTexto(contrato);

    switch (estado) {
      case "Vencido":
        return "bg-danger";
      case "Por vencer":
        return "bg-warning text-dark";
      case "Activo":
        return "bg-success";
      default:
        return "bg-secondary";
    }
  }

  resetFilters(): void {
    this.filterForm.reset({
      searchTerm: '',
      filterType: 'all',
      sortBy: 'dateDesc'
    });
    this.filterContratos();
  }

  deleteContrato(id: string): void {
    if (confirm('¿Está seguro que desea eliminar este contrato? Esta acción no se puede deshacer.')) {
      this.contratoService.eliminarContrato(id).subscribe({
        next: () => {
          this.contratos = this.contratos.filter(contrato => contrato._id !== id);
          this.filterContratos();
          // Mostrar mensaje de éxito
        },
        error: (error: any) => {
          console.error('Error al eliminar contrato:', error);
          // Mostrar mensaje de error
        }
      });
    }
  }
}