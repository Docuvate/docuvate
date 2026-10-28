// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'preview_connector_source_nodes_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PreviewConnectorSourceNodesRequestDto
    extends PreviewConnectorSourceNodesRequestDto {
  @override
  final BuiltMap<String, String> credentials;
  @override
  final String? parentPath;

  factory _$PreviewConnectorSourceNodesRequestDto(
          [void Function(PreviewConnectorSourceNodesRequestDtoBuilder)?
              updates]) =>
      (new PreviewConnectorSourceNodesRequestDtoBuilder()..update(updates))
          ._build();

  _$PreviewConnectorSourceNodesRequestDto._(
      {required this.credentials, this.parentPath})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        credentials, r'PreviewConnectorSourceNodesRequestDto', 'credentials');
  }

  @override
  PreviewConnectorSourceNodesRequestDto rebuild(
          void Function(PreviewConnectorSourceNodesRequestDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PreviewConnectorSourceNodesRequestDtoBuilder toBuilder() =>
      new PreviewConnectorSourceNodesRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PreviewConnectorSourceNodesRequestDto &&
        credentials == other.credentials &&
        parentPath == other.parentPath;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, credentials.hashCode);
    _$hash = $jc(_$hash, parentPath.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'PreviewConnectorSourceNodesRequestDto')
          ..add('credentials', credentials)
          ..add('parentPath', parentPath))
        .toString();
  }
}

class PreviewConnectorSourceNodesRequestDtoBuilder
    implements
        Builder<PreviewConnectorSourceNodesRequestDto,
            PreviewConnectorSourceNodesRequestDtoBuilder> {
  _$PreviewConnectorSourceNodesRequestDto? _$v;

  MapBuilder<String, String>? _credentials;
  MapBuilder<String, String> get credentials =>
      _$this._credentials ??= new MapBuilder<String, String>();
  set credentials(MapBuilder<String, String>? credentials) =>
      _$this._credentials = credentials;

  String? _parentPath;
  String? get parentPath => _$this._parentPath;
  set parentPath(String? parentPath) => _$this._parentPath = parentPath;

  PreviewConnectorSourceNodesRequestDtoBuilder() {
    PreviewConnectorSourceNodesRequestDto._defaults(this);
  }

  PreviewConnectorSourceNodesRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _credentials = $v.credentials.toBuilder();
      _parentPath = $v.parentPath;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PreviewConnectorSourceNodesRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$PreviewConnectorSourceNodesRequestDto;
  }

  @override
  void update(
      void Function(PreviewConnectorSourceNodesRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PreviewConnectorSourceNodesRequestDto build() => _build();

  _$PreviewConnectorSourceNodesRequestDto _build() {
    _$PreviewConnectorSourceNodesRequestDto _$result;
    try {
      _$result = _$v ??
          new _$PreviewConnectorSourceNodesRequestDto._(
              credentials: credentials.build(), parentPath: parentPath);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'credentials';
        credentials.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'PreviewConnectorSourceNodesRequestDto',
            _$failedField,
            e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
