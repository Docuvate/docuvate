// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_paperless_installation_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdatePaperlessInstallationRequestDto
    extends UpdatePaperlessInstallationRequestDto {
  @override
  final String? displayName;
  @override
  final BuiltMap<String, String>? credentials;
  @override
  final bool? keepOcrText;
  @override
  final bool? rerunOcr;
  @override
  final bool? includeArchivedPdf;

  factory _$UpdatePaperlessInstallationRequestDto(
          [void Function(UpdatePaperlessInstallationRequestDtoBuilder)?
              updates]) =>
      (UpdatePaperlessInstallationRequestDtoBuilder()..update(updates))
          ._build();

  _$UpdatePaperlessInstallationRequestDto._(
      {this.displayName,
      this.credentials,
      this.keepOcrText,
      this.rerunOcr,
      this.includeArchivedPdf})
      : super._();
  @override
  UpdatePaperlessInstallationRequestDto rebuild(
          void Function(UpdatePaperlessInstallationRequestDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdatePaperlessInstallationRequestDtoBuilder toBuilder() =>
      UpdatePaperlessInstallationRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdatePaperlessInstallationRequestDto &&
        displayName == other.displayName &&
        credentials == other.credentials &&
        keepOcrText == other.keepOcrText &&
        rerunOcr == other.rerunOcr &&
        includeArchivedPdf == other.includeArchivedPdf;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, credentials.hashCode);
    _$hash = $jc(_$hash, keepOcrText.hashCode);
    _$hash = $jc(_$hash, rerunOcr.hashCode);
    _$hash = $jc(_$hash, includeArchivedPdf.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'UpdatePaperlessInstallationRequestDto')
          ..add('displayName', displayName)
          ..add('credentials', credentials)
          ..add('keepOcrText', keepOcrText)
          ..add('rerunOcr', rerunOcr)
          ..add('includeArchivedPdf', includeArchivedPdf))
        .toString();
  }
}

class UpdatePaperlessInstallationRequestDtoBuilder
    implements
        Builder<UpdatePaperlessInstallationRequestDto,
            UpdatePaperlessInstallationRequestDtoBuilder> {
  _$UpdatePaperlessInstallationRequestDto? _$v;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  MapBuilder<String, String>? _credentials;
  MapBuilder<String, String> get credentials =>
      _$this._credentials ??= MapBuilder<String, String>();
  set credentials(MapBuilder<String, String>? credentials) =>
      _$this._credentials = credentials;

  bool? _keepOcrText;
  bool? get keepOcrText => _$this._keepOcrText;
  set keepOcrText(bool? keepOcrText) => _$this._keepOcrText = keepOcrText;

  bool? _rerunOcr;
  bool? get rerunOcr => _$this._rerunOcr;
  set rerunOcr(bool? rerunOcr) => _$this._rerunOcr = rerunOcr;

  bool? _includeArchivedPdf;
  bool? get includeArchivedPdf => _$this._includeArchivedPdf;
  set includeArchivedPdf(bool? includeArchivedPdf) =>
      _$this._includeArchivedPdf = includeArchivedPdf;

  UpdatePaperlessInstallationRequestDtoBuilder() {
    UpdatePaperlessInstallationRequestDto._defaults(this);
  }

  UpdatePaperlessInstallationRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _displayName = $v.displayName;
      _credentials = $v.credentials?.toBuilder();
      _keepOcrText = $v.keepOcrText;
      _rerunOcr = $v.rerunOcr;
      _includeArchivedPdf = $v.includeArchivedPdf;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdatePaperlessInstallationRequestDto other) {
    _$v = other as _$UpdatePaperlessInstallationRequestDto;
  }

  @override
  void update(
      void Function(UpdatePaperlessInstallationRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdatePaperlessInstallationRequestDto build() => _build();

  _$UpdatePaperlessInstallationRequestDto _build() {
    _$UpdatePaperlessInstallationRequestDto _$result;
    try {
      _$result = _$v ??
          _$UpdatePaperlessInstallationRequestDto._(
            displayName: displayName,
            credentials: _credentials?.build(),
            keepOcrText: keepOcrText,
            rerunOcr: rerunOcr,
            includeArchivedPdf: includeArchivedPdf,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'credentials';
        _credentials?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'UpdatePaperlessInstallationRequestDto',
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
