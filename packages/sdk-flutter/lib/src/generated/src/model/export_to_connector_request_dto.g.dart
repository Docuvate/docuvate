// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'export_to_connector_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ExportToConnectorRequestDto extends ExportToConnectorRequestDto {
  @override
  final String documentId;
  @override
  final String? destinationRef;

  factory _$ExportToConnectorRequestDto(
          [void Function(ExportToConnectorRequestDtoBuilder)? updates]) =>
      (ExportToConnectorRequestDtoBuilder()..update(updates))._build();

  _$ExportToConnectorRequestDto._(
      {required this.documentId, this.destinationRef})
      : super._();
  @override
  ExportToConnectorRequestDto rebuild(
          void Function(ExportToConnectorRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ExportToConnectorRequestDtoBuilder toBuilder() =>
      ExportToConnectorRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ExportToConnectorRequestDto &&
        documentId == other.documentId &&
        destinationRef == other.destinationRef;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, documentId.hashCode);
    _$hash = $jc(_$hash, destinationRef.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ExportToConnectorRequestDto')
          ..add('documentId', documentId)
          ..add('destinationRef', destinationRef))
        .toString();
  }
}

class ExportToConnectorRequestDtoBuilder
    implements
        Builder<ExportToConnectorRequestDto,
            ExportToConnectorRequestDtoBuilder> {
  _$ExportToConnectorRequestDto? _$v;

  String? _documentId;
  String? get documentId => _$this._documentId;
  set documentId(String? documentId) => _$this._documentId = documentId;

  String? _destinationRef;
  String? get destinationRef => _$this._destinationRef;
  set destinationRef(String? destinationRef) =>
      _$this._destinationRef = destinationRef;

  ExportToConnectorRequestDtoBuilder() {
    ExportToConnectorRequestDto._defaults(this);
  }

  ExportToConnectorRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _documentId = $v.documentId;
      _destinationRef = $v.destinationRef;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ExportToConnectorRequestDto other) {
    _$v = other as _$ExportToConnectorRequestDto;
  }

  @override
  void update(void Function(ExportToConnectorRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ExportToConnectorRequestDto build() => _build();

  _$ExportToConnectorRequestDto _build() {
    final _$result = _$v ??
        _$ExportToConnectorRequestDto._(
          documentId: BuiltValueNullFieldError.checkNotNull(
              documentId, r'ExportToConnectorRequestDto', 'documentId'),
          destinationRef: destinationRef,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
