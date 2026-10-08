// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'duplicate_stack_keep_version_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DuplicateStackKeepVersionRequestDto
    extends DuplicateStackKeepVersionRequestDto {
  @override
  final String versionDocumentId;

  factory _$DuplicateStackKeepVersionRequestDto(
          [void Function(DuplicateStackKeepVersionRequestDtoBuilder)?
              updates]) =>
      (new DuplicateStackKeepVersionRequestDtoBuilder()..update(updates))
          ._build();

  _$DuplicateStackKeepVersionRequestDto._({required this.versionDocumentId})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(versionDocumentId,
        r'DuplicateStackKeepVersionRequestDto', 'versionDocumentId');
  }

  @override
  DuplicateStackKeepVersionRequestDto rebuild(
          void Function(DuplicateStackKeepVersionRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DuplicateStackKeepVersionRequestDtoBuilder toBuilder() =>
      new DuplicateStackKeepVersionRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DuplicateStackKeepVersionRequestDto &&
        versionDocumentId == other.versionDocumentId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, versionDocumentId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DuplicateStackKeepVersionRequestDto')
          ..add('versionDocumentId', versionDocumentId))
        .toString();
  }
}

class DuplicateStackKeepVersionRequestDtoBuilder
    implements
        Builder<DuplicateStackKeepVersionRequestDto,
            DuplicateStackKeepVersionRequestDtoBuilder> {
  _$DuplicateStackKeepVersionRequestDto? _$v;

  String? _versionDocumentId;
  String? get versionDocumentId => _$this._versionDocumentId;
  set versionDocumentId(String? versionDocumentId) =>
      _$this._versionDocumentId = versionDocumentId;

  DuplicateStackKeepVersionRequestDtoBuilder() {
    DuplicateStackKeepVersionRequestDto._defaults(this);
  }

  DuplicateStackKeepVersionRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _versionDocumentId = $v.versionDocumentId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DuplicateStackKeepVersionRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DuplicateStackKeepVersionRequestDto;
  }

  @override
  void update(
      void Function(DuplicateStackKeepVersionRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DuplicateStackKeepVersionRequestDto build() => _build();

  _$DuplicateStackKeepVersionRequestDto _build() {
    final _$result = _$v ??
        new _$DuplicateStackKeepVersionRequestDto._(
            versionDocumentId: BuiltValueNullFieldError.checkNotNull(
                versionDocumentId,
                r'DuplicateStackKeepVersionRequestDto',
                'versionDocumentId'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
