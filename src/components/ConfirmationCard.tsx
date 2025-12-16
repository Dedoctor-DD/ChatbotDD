import { CheckCircle2, Edit3, Truck, Wrench } from 'lucide-react';

interface ConfirmationCardProps {
    serviceType: 'transport' | 'workshop';
    data: Record<string, any>;
    onConfirm: () => void;
    onEdit: () => void;
}

export function ConfirmationCard({ serviceType, data, onConfirm, onEdit }: ConfirmationCardProps) {
    const isTransport = serviceType === 'transport';

    return (
        <div className="confirmation-card">
            <div className="confirmation-header">
                {isTransport ? (
                    <Truck className="icon-md" />
                ) : (
                    <Wrench className="icon-md" />
                )}
                <h3>{isTransport ? 'Solicitud de Transporte' : 'Solicitud de Taller'}</h3>
            </div>

            <div className="confirmation-body">
                {isTransport ? (
                    <>
                        <div className="data-row">
                            <span className="data-label">Origen:</span>
                            <span className="data-value">{data.origen}</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Destino:</span>
                            <span className="data-value">{data.destino}</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Fecha:</span>
                            <span className="data-value">{data.fecha}</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Hora:</span>
                            <span className="data-value">{data.hora}</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Sillas:</span>
                            <span className="data-value">{data.cantidad_sillas || 1}</span>
                        </div>
                        {data.observaciones && (
                            <div className="data-row">
                                <span className="data-label">Observaciones:</span>
                                <span className="data-value">{data.observaciones}</span>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="data-row">
                            <span className="data-label">Problema:</span>
                            <span className="data-value">{data.tipo_problema}</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Modelo:</span>
                            <span className="data-value">{data.modelo_silla}</span>
                        </div>
                        <div className="data-row">
                            <span className="data-label">Teléfono:</span>
                            <span className="data-value">{data.telefono}</span>
                        </div>
                        {data.observaciones && (
                            <div className="data-row">
                                <span className="data-label">Observaciones:</span>
                                <span className="data-value">{data.observaciones}</span>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="confirmation-actions">
                <button
                    onClick={() => alert('¡Próximamente podrás subir fotos aquí! Estamos habilitando el almacenamiento seguro.')}
                    className="btn-secondary text-xs"
                    title="Próximamente"
                >
                    📷 Adjuntar Foto
                </button>
                <button onClick={onEdit} className="btn-secondary">
                    <Edit3 className="icon-sm" />
                    Editar
                </button>
                <button onClick={onConfirm} className="btn-primary">
                    <CheckCircle2 className="icon-sm" />
                    Confirmar Solicitud
                </button>
            </div>
        </div>
    );
}
