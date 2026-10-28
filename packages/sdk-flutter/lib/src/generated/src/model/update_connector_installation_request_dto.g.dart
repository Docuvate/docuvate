// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_connector_installation_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateConnectorInstallationRequestDto
    extends UpdateConnectorInstallationRequestDto {
  @override
  final String? displayName;
  @override
  final JsonObject? sourceScope;

  factory _$UpdateConnectorInstallationRequestDto(
          [void Function(UpdateConnectorInstallationRequestDtoBuilder)?
              updates]) =>
      (new UpdateConnectorInstallationRequestDtoBuilder()..update(updates))
          ._build();

  _$UpdateConnectorInstallationRequestDto._(
      {this.displayName, this.sourceScope})
      : super._();

  @override
  UpdateConnectorInstallationRequestDto rebuild(
          void Function(UpdateConnectorInstallationRequestDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateConnectorInstallationRequestDtoBuilder toBuilder() =>
      new UpdateConnectorInstallationRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateConnectorInstallationRequestDto &&
        displayName == other.displayName &&
        sourceScope == other.sourceScope;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, sourceScope.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'UpdateConnectorInstallationRequestDto')
          ..add('displayName', displayName)
          ..add('sourceScope', sourceScope))
        .toString();
  }
}

class UpdateConnectorInstallationRequestDtoBuilder
    implements
        Builder<UpdateConnectorInstallationRequestDto,
            UpdateConnectorInstallationRequestDtoBuilder> {
  _$UpdateConnectorInstallationRequestDto? _$v;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  JsonObject? _sourceScope;
  JsonObject? get sourceScope => _$this._sourceScope;
  set sourceScope(JsonObject? sourceScope) => _$this._sourceScope = sourceScope;

  UpdateConnectorInstallationRequestDtoBuilder() {
    UpdateConnectorInstallationRequestDto._defaults(this);
  }

  UpdateConnectorInstallationRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _displayName = $v.displayName;
      _sourceScope = $v.sourceScope;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateConnectorInstallationRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$UpdateConnectorInstallationRequestDto;
  }

  @override
  void update(
      void Function(UpdateConnectorInstallationRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateConnectorInstallationRequestDto build() => _build();

  _$UpdateConnectorInstallationRequestDto _build() {
    final _$result = _$v ??
        new _$UpdateConnectorInstallationRequestDto._(
            displayName: displayName, sourceScope: sourceScope);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
