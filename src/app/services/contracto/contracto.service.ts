import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as bootstrap from 'bootstrap';
import { catchError, Observable, switchMap, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContractoService {
  private modalInstance: any;
constructor(private http: HttpClient) {}
  private apiUrl = "https://localhost:7299/api"
  private fileUrl = 'https://localhost:7299/api';

  getContratos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Contrato`);
  }
  
  onFileSelected(event: any) {
    if (!event || !event.target || !event.target.files) {
      console.error("No se pudo obtener el archivo del evento.");
      return;
    }
  
    const file: File = event.target.files[0];
  
    if (!file) {
      console.warn("Ningún archivo seleccionado.");
      return;
    }
  
    console.log("Archivo seleccionado:", file.name);
    // Aquí puedes manejar la subida del archivo
  }
  

  getContrato(id: string | number): Observable<any> {
    if (!id) {
      console.error("ID de contrato no válido:", id)
      return throwError(() => new Error("ID de contrato no válido"))
    }

    // Asegurarse de que el ID se incluya correctamente en la URL
    console.log(`Obteniendo contrato con ID: ${id}`)
    return this.http.get<any>(`${this.apiUrl}/Contrato/${id}`)
  }

  crearContrato(contrato: any, archivo?: File): Observable<any> {
    const formData = new FormData();

    Object.keys(contrato).forEach(key => {
      formData.append(key, contrato[key]);
    });

    if (archivo) {
      formData.append('archivo', archivo, archivo.name);
    }

    return this.http.post<any>(`${this.apiUrl}/Contrato/create`, formData);
  }


  getEmpresasPropietario(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Empresa`).pipe(
      catchError((error) => {
        console.error("Error al obtener empresas propietario:", error)
        return throwError(() => new Error("Error al cargar empresas propietario. Por favor intente nuevamente."))
      }),
    )
  }

  tienePdf(contrato: any): boolean {

    if (!contrato) return false

    if (Array.isArray(contrato.archivos) && contrato.archivos.length > 0) {
      return true
    }

    if (contrato.archivos && contrato.archivos.nombre) {
      return true
    }

    if (contrato.archivoPdf && (contrato.archivoPdf.nombre || contrato.archivoPdf.name)) {
      return true
    }

    return false
  }


  getTiposContrato(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/TipoContratos`).pipe(
      catchError((error) => {
        console.error("Error al obtener tipos de contrato:", error)
        return throwError(() => new Error("Error al cargar tipos de contrato. Por favor intente nuevamente."))
      }),
    )
  }

  getTipoServicio(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Servicios`).pipe(
      catchError((error) => {
        console.error("Error al obtener tipos de Servicio:", error)
        return throwError(() => new Error("Error al cargar tipos de Servicios. Por favor intente nuevamente."))
      }),
    )
  }


  actualizarContrato(id: string | number, contrato: any, archivo?: File): Observable<any> {
    const formData = new FormData();

    Object.keys(contrato).forEach(key => {
      formData.append(key, contrato[key]);
    });

    if (archivo) {
      formData.append('archivo', archivo, archivo.name);
    }

    return this.http.put<any>(`${this.apiUrl}/${id}`, formData);
  }

  eliminarContrato(id: string | number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/Contrato/${id}`);
  }

  descargarPdf(id: string | number, nombreCliente: string): void {
    this.obtenerPdfBlob(id).subscribe({
      next: (blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob)
        // Crear enlace de descarga
        const link = document.createElement("a")
        link.href = url
        link.download = `Contrato_${nombreCliente || "Descarga"}.pdf`
        // Simular clic
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        // Liberar URL
        window.URL.revokeObjectURL(url)
      },
      error: (error) => {
        console.error("Error al descargar PDF:", error)
        alert("Error al descargar el PDF. Por favor intente nuevamente.")
      },
    })
  }



  
  obtenerPdfBlob(id: string | number): Observable<Blob> {
    if (!id) {
      console.error("ID no válido para obtener PDF: ", id);
      return throwError(() => new Error("ID no válido para obtener PDF"));
    }
  
    console.log("Obteniendo PDF blob para contrato ID:", id);
    return this.http
      .get(`${this.apiUrl}/Archivos/ver/${id}`, {
        responseType: "blob",
      })
      .pipe(
        catchError((error) => {
          console.error(`Error al obtener PDF para contrato ID ${id}:`, error);
          console.log("Intentando obtener lista de archivos del contrato");
          return this.http.get<any[]>(`${this.apiUrl}/Archivos/listado-pdf-contrato?idcontrato=${id}`).pipe(
            catchError((listError) => {
              console.error(`Error al obtener lista de archivos:`, listError);
              return throwError(() => new Error(`No se pudo obtener la lista de archivos: ${listError.message || "Error desconocido"}`));
            }),
            switchMap((archivos) => {
              if (archivos && archivos.length > 0) {
                const archivoId = archivos[1].id;
                console.log(`Usando archivo ID ${archivoId} del contrato`);
                return this.http.get(`${this.apiUrl}/Archivos/ver/${archivoId}`, {
                  responseType: "blob",
                });
              } else {
                return throwError(() => new Error("No hay archivos asociados a este contrato"));
              }
            }),
          );
        }),
      );
  }
  


  visualizarPdf(id:  number): Observable<any> {
    
    this.obtenerPdfBlob(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open
        
        (url); // Abre el PDF en una nueva pestaña
        setTimeout(() => window.URL.revokeObjectURL(url), 10000); // Limpia la URL después de 10 segundos
      },
      error: (error) => {
        console.error("Error al visualizar el PDF:", error);
        alert("No se pudo visualizar el PDF.");
      },
    });
    
    return this.http.get(`${this.fileUrl}`, { responseType: 'blob' });
    
  }
}
