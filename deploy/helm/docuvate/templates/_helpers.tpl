{{- define "docuvate.imageTag" -}}
{{- default .Chart.AppVersion .Values.global.imageTag -}}
{{- end -}}

{{- define "docuvate.apiImage" -}}
{{ .Values.global.imageRegistry }}/docuvate-api:{{ include "docuvate.imageTag" . }}
{{- end -}}

{{- define "docuvate.webImage" -}}
{{ .Values.global.imageRegistry }}/docuvate-web:{{ include "docuvate.imageTag" . }}
{{- end -}}

{{- define "docuvate.workerImage" -}}
{{- if .Values.gpuWorker.enabled -}}
{{ .Values.global.imageRegistry }}/docuvate-worker-gpu:{{ include "docuvate.imageTag" . }}
{{- else -}}
{{ .Values.global.imageRegistry }}/docuvate-worker{{ .Values.worker.imageSuffix }}:{{ include "docuvate.imageTag" . }}
{{- end -}}
{{- end -}}

{{- define "docuvate.versionSuffix" -}}
{{- trimPrefix "v" .Chart.AppVersion | replace "." "-" -}}
{{- end -}}

{{- define "docuvate.podSecurityRestricted" -}}
runAsNonRoot: true
seccompProfile:
  type: RuntimeDefault
{{- end -}}

{{- define "docuvate.containerSecurityRestricted" -}}
allowPrivilegeEscalation: false
capabilities:
  drop: [ALL]
{{- end -}}
