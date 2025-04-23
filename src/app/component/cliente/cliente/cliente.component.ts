import { HttpClient } from "@angular/common/http"
import { Component, OnInit } from "@angular/core"
// Cambia la importación de type-only a una importación regular
import { FormGroup, Validators } from "@angular/forms"
import { throwError } from "rxjs"
import { Observable } from "rxjs/internal/Observable"
import { Client } from "src/app/models/contract/contract.module"
import { ClienteService } from "src/app/services/Cliente/cliente.service"
import * as bootstrap from "bootstrap"
import { FormBuilder } from '@angular/forms';




@Component({
  selector: "app-cliente",
  templateUrl: "./cliente.component.html",
  styleUrls: ["./cliente.component.css"],
})
export class ClienteComponent implements OnInit {
  allClients: any[] = []
  searchTerm = ""
  filterType = "all"
  sortBy = "nameAsc"
  clients: Client[] = []
  clientForm: FormGroup
  selectedClient: Client | null = null
  submitting = false
  mostrarAlerta = false
  tipoAlerta = "success"
  filteredClients: any[] = []
  mensajeAlerta = ""
  message: { type: string; text: string } | null = null
  apiUrl = "http://10.0.0.15:6970/api/Cliente"
  loading = false
  modalInstance: any = null

  constructor(
    private fb: FormBuilder, private clientService: ClienteService, private http: HttpClient,
  ) {
    this.clientForm = this.fb.group({
      name: ["", Validators.required],
      LastName: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      phone: [""],
      Documento_Identidad: [""],
      address: [""],
      contactPerson: [""],
    })
  }

  ngOnInit(): void {
    this.loadClients()
  }

  loadClients(): void {
    this.loading = true
    this.clientService.getClientes().subscribe({
      next: (data) => {
        this.allClients = data
        this.applyFilters()
        this.loading = false
      },
      error: (error) => {
        console.error("Error al cargar clientes:", error)
        this.loading = false
      },
    })
  }

  applyFilters(): void {
    // Filtrar por término de búsqueda
    let result = this.allClients

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase()
      result = result.filter(
        (client) =>
          (client.name || "").toLowerCase().includes(term) ||
          (client.email || "").toLowerCase().includes(term) ||
          (client.phone || "").toLowerCase().includes(term),
      )
    }

    // Filtrar por tipo
    if (this.filterType !== "all") {
      if (this.filterType === "active") {
        result = result.filter((client) => client.hasActiveContracts)
      } else if (this.filterType === "inactive") {
        result = result.filter((client) => !client.hasActiveContracts)
      } else if (this.filterType === "recent") {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        result = result.filter((client) => {
          if (!client.createdAt) return false
          const createdAt = new Date(client.createdAt)
          return createdAt >= thirtyDaysAgo
        })
      }
    }

    this.filteredClients = result
  }

  filterOptions = [
    { value: "all", label: "Todos los clientes" },
    { value: "active", label: "Con contratos activos" },
    { value: "inactive", label: "Sin contratos activos" },
    { value: "recent", label: "Agregados recientemente" },
  ]

  sortOptions = [
    { value: "nameAsc", label: "Nombre (A-Z)" },
    { value: "nameDesc", label: "Nombre (Z-A)" },
    { value: "dateAsc", label: "Fecha de creación (Antigua-Nueva)" },
    { value: "dateDesc", label: "Fecha de creación (Nueva-Antigua)" },
    { value: "contractsDesc", label: "Más contratos primero" },
  ]

  onSearchChange(): void {
    this.applyFilters()
  }

  onFilterChange(): void {
    this.applyFilters()
  }

  resetFilters(): void {
    this.searchTerm = ""
    this.filterType = "all"
    this.applyFilters()
  }


  openForm(): void {

    this.resetForm()


    this.clientForm.patchValue({
      name: "",
      LastName: "",
      email: "",
      phone: "",
      Documento_Identidad: "",
      address: "",
      contactPerson: "",
    })


  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client)
  }

  deleteClient(id: string): void {
    if (confirm("¿Está seguro de eliminar este cliente?")) {
      this.clientService.deleteClient(id).subscribe({
        next: () => {
          this.clients = this.clients.filter((c) => c._id !== id)
          this.loadClients() 
          this.showMessage("success", "Cliente eliminado correctamente")
        },
        error: (error) => {
          console.error("Error al eliminar cliente:", error)
          this.showMessage("danger", "Error al eliminar el cliente")
        },
      })
    }
  }

  updateClient(id: string | undefined, client: Client): Observable<Client> {
    if (!id) {
      return throwError(() => new Error("ID de cliente no proporcionado"))
    }
    return this.http.put<Client>(`${this.apiUrl}/${id}`, client)
  }

  editClient(client: Client): void {
    this.selectedClient = { ...client } 
    this.clientForm.patchValue({
      name: client.Name,
      LastName: client.LastName, 
      email: client.Email,
      phone: client.phone || "",
      address: client.Address || "",
      Documento_Identidad: client.Documento_Identidad || "",
    })


    const modalElement = document.getElementById("clientModal")
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement)
      this.modalInstance.show()
    }
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      Object.keys(this.clientForm.controls).forEach((key) => {
        this.clientForm.get(key)?.markAsTouched()
      })
      return
    }

    this.submitting = true
    const clientData: Client = this.clientForm.value

    if (this.selectedClient && this.selectedClient._id) {
      this.clientService.updateClient(this.selectedClient._id, clientData).subscribe({
        next: (updatedClient: Client) => {
          const index = this.clients.findIndex((c) => c._id === updatedClient._id)
          if (index !== -1) {
            this.clients[index] = updatedClient
          }
          this.showMessage("success", "Cliente actualizado correctamente")
          this.resetForm()
          this.loadClients()
          this.cerrarModal()
        },
        error: (error) => {
          console.error("Error al actualizar cliente:", error)
          this.showMessage("danger", "Error al actualizar el cliente")
          this.submitting = false
        },
      })
    } else {
      this.clientService.createClient(clientData).subscribe({
        next: (newClient: Client) => {
          this.clients.push(newClient)
          this.showMessage("success", "Cliente creado correctamente")
          this.resetForm()
          this.loadClients()
          this.cerrarModal()
        },
        error: (error) => {
          console.error("Error al crear cliente:", error)
          this.showMessage("danger", "Error al crear el cliente")
          this.submitting = false
        },
      })
    }
  }

  eliminarCliente(id: string): void {
    if (confirm("¿Está seguro de eliminar este cliente?")) {
      this.clientService.deleteClient(id).subscribe({
        next: () => {
          this.clients = this.clients.filter((c) => c._id !== id)
          this.mostrarMensaje("success", "Cliente eliminado correctamente")
          this.loadClients()
        },
        error: (error: any) => {
          console.error("Error al eliminar cliente:", error)
          this.mostrarMensaje("danger", "Error al eliminar el cliente")
        },
      })
    }
  }

  cerrarModal(): void {
    if (this.modalInstance) {
      this.modalInstance.hide()
    }
  }

  mostrarMensaje(tipo: string, mensaje: string): void {
    this.tipoAlerta = tipo
    this.mensajeAlerta = mensaje
    this.mostrarAlerta = true
    setTimeout(() => {
      this.mostrarAlerta = false
    }, 5000)
  }

  resetForm(): void {
    this.clientForm.reset()
    this.selectedClient = null
    this.submitting = false
  }

  showMessage(type: string, text: string): void {
    this.message = { type, text }
    setTimeout(() => {
      this.message = null
    }, 3000)
  }
}

