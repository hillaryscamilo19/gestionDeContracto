import { Component, Input } from '@angular/core';
import { ContractoService } from 'src/app/services/contracto/contracto.service';

@Component({
  selector: 'app-pdf-viewer-modal',
  template: `
  <div class="modal fade" id="pdfViewerModal" tabindex="-1" aria-labelledby="pdfViewerModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="pdfViewerModalLabel">{{ titulo }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <pdf-viewer 
            [src]="pdfSrc" 
            [render-text]="true"
            [original-size]="false"
            [show-all]="true"
            [fit-to-page]="true"
            style="height: 70vh;"
          ></pdf-viewer>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          <button type="button" class="btn btn-primary" (click)="descargarPdf()">Descargar</button>
        </div>
      </div>
    </div>
  </div>
`,
  templateUrl: './pdf-viewer-modal.component.html',
  styleUrls: ['./pdf-viewer-modal.component.css']
})

export class PdfViewerModalComponent {
  @Input() pdfSrc: string = '';
  @Input() titulo: string = 'Visualización de Documento';
  @Input() contratoId: string = '';
  @Input() clienteNombre: string = '';
  
  constructor(private contratoService: ContractoService) { }
  
// contract-form.component.ts
// Reemplaza el método descargarPdf
descargarPdf(id: string): void {
  // Primero obtener el contrato para tener el nombre del cliente
  this.contratoService.getContrato(id).subscribe({
    next: (contrato) => {
      // Luego obtener el blob del PDF
      this.contratoService.obtenerPdfBlob(id).subscribe({
        next: (blob: Blob) => {
          // Crear URL del blob
          const url = window.URL.createObjectURL(blob);
          // Crear enlace de descarga
          const link = document.createElement('a');
          link.href = url;
          link.download = `Contrato_${contrato.clienteNombre || 'Descarga'}.pdf`;
          // Simular clic
          link.click();
          // Liberar URL
          window.URL.revokeObjectURL(url);
        },
        error: (error: any) => {
          console.error('Error al descargar PDF:', error);
        }
      });
    },
    error: (error: any) => {
      console.error('Error al obtener contrato:', error);
    }
  });
}
}