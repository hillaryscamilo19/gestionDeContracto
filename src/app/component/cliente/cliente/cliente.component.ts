import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { throwError } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { Client } from 'src/app/models/contract/contract.module';
import { ClienteService } from 'src/app/services/Cliente/cliente.service';

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.component.html',
  styleUrls: ['./cliente.component.css']
})
export class ClienteComponent {
openForm() {
throw new Error('Method not implemented.');
}
  clients: Client[] = []
  clientForm: FormGroup
  selectedClient: Client | null = null
  submitting = false
  mostrarAlerta = false
  tipoAlerta = "success"
  mensajeAlerta = ""
  message: { type: string; text: string } | null = null
  apiUrl = "http://localhost:3000/clients"
  loading: any;

  constructor(
    private fb: FormBuilder,
    private clientService: ClienteService,
    private http: HttpClient,
  ) {
    this.clientForm = this.fb.group({
      name: ["", Validators.required],
      email: ["", [Validators.required, Validators.email]],
      phone: [""],
      address: [""],
      contactPerson: [""],
    })
  }

  ngOnInit(): void {
    this.loadClients()
  }

  loadClients(): void {
    this.clientService.getClients().subscribe(
      (clients) => {
        this.clients = clients
      },
      (error) => {
        console.error("Error al cargar los clientes:", error)
      },
    )
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client)
  }

  deleteClient(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`)
  }

  updateClient(id: string | undefined, client: Client): Observable<Client> {
    if (!id) {
      return throwError(() => new Error("ID de cliente no proporcionado"))
    }
    return this.http.put<Client>(`${this.apiUrl}/${id}`, client)
  }

  editClient(client: Client): void {
    this.selectedClient = { ...client } // Crear una copia para evitar modificar el original
    this.clientForm.patchValue({
      name: client.name,
      email: client.email,
      phone: client.phone || "",
      address: client.address || "",
      contactPerson: client.contactPerson || "",
    })
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
      // Update existing client
      this.clientService.updateClient(this.selectedClient._id, clientData).subscribe({
        next: (updatedClient: Client) => {
          const index = this.clients.findIndex((c) => c._id === updatedClient._id)
          if (index !== -1) {
            this.clients[index] = updatedClient
          }
          this.showMessage("success", "Cliente actualizado correctamente")
          this.resetForm()
        },
        error: (error) => {
          console.error("Error al actualizar cliente:", error)
          this.showMessage("danger", "Error al actualizar el cliente")
          this.submitting = false
        },
      })
    } else {
      // Create new client
      this.clientService.createClient(clientData).subscribe({
        next: (newClient: Client) => {
          this.clients.push(newClient)
          this.showMessage("success", "Cliente creado correctamente")
          this.resetForm()
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
    if (confirm("¿Está seguro de eliminar este contrato?")) {
      this.clientService.deleteClient(id).subscribe({
        next: () => {
          this.clients = this.clients.filter((c) => c._id !== id)
          this.mostrarMensaje("success", "Contrato eliminado correctamente")
        },
        error: (error: any) => {
          console.error("Error al eliminar contrato:", error)
          this.mostrarMensaje("danger", "Error al eliminar el contrato")
        },
      })
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
