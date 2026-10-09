// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'duplicate_stack_set_primary_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DuplicateStackSetPrimaryRequestDto
    extends DuplicateStackSetPrimaryRequestDto {
  @override
  final String documentId;
  @override
  final String stackId;

  factory _$DuplicateStackSetPrimaryRequestDto(
          [void Function(DuplicateStackSetPrimaryRequestDtoBuilder)?
              updates]) =>
      (DuplicateStackSetPrimaryRequestDtoBuilder()..update(updates))._build();

  _$DuplicateStackSetPrimaryRequestDto._(
      {required this.documentId, required this.stackId})
      : super._();
  @override
  DuplicateStackSetPrimaryRequestDto rebuild(
          void Function(DuplicateStackSetPrimaryRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DuplicateStackSetPrimaryRequestDtoBuilder toBuilder() =>
      DuplicateStackSetPrimaryRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DuplicateStackSetPrimaryRequestDto &&
        documentId == other.documentId &&
        stackId == other.stackId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, documentId.hashCode);
    _$hash = $jc(_$hash, stackId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DuplicateStackSetPrimaryRequestDto')
          ..add('documentId', documentId)
          ..add('stackId', stackId))
        .toString();
  }
}

class DuplicateStackSetPrimaryRequestDtoBuilder
    implements
        Builder<DuplicateStackSetPrimaryRequestDto,
            DuplicateStackSetPrimaryRequestDtoBuilder> {
  _$DuplicateStackSetPrimaryRequestDto? _$v;

  String? _documentId;
  String? get documentId => _$this._documentId;
  set documentId(String? documentId) => _$this._documentId = documentId;

  String? _stackId;
  String? get stackId => _$this._stackId;
  set stackId(String? stackId) => _$this._stackId = stackId;

  DuplicateStackSetPrimaryRequestDtoBuilder() {
    DuplicateStackSetPrimaryRequestDto._defaults(this);
  }

  DuplicateStackSetPrimaryRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _documentId = $v.documentId;
      _stackId = $v.stackId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DuplicateStackSetPrimaryRequestDto other) {
    _$v = other as _$DuplicateStackSetPrimaryRequestDto;
  }

  @override
  void update(
      void Function(DuplicateStackSetPrimaryRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DuplicateStackSetPrimaryRequestDto build() => _build();

  _$DuplicateStackSetPrimaryRequestDto _build() {
    final _$result = _$v ??
        _$DuplicateStackSetPrimaryRequestDto._(
          documentId: BuiltValueNullFieldError.checkNotNull(
              documentId, r'DuplicateStackSetPrimaryRequestDto', 'documentId'),
          stackId: BuiltValueNullFieldError.checkNotNull(
              stackId, r'DuplicateStackSetPrimaryRequestDto', 'stackId'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
