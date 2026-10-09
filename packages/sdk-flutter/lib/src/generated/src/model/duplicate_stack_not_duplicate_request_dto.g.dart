// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'duplicate_stack_not_duplicate_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DuplicateStackNotDuplicateRequestDto
    extends DuplicateStackNotDuplicateRequestDto {
  @override
  final String otherDocumentId;

  factory _$DuplicateStackNotDuplicateRequestDto(
          [void Function(DuplicateStackNotDuplicateRequestDtoBuilder)?
              updates]) =>
      (DuplicateStackNotDuplicateRequestDtoBuilder()..update(updates))._build();

  _$DuplicateStackNotDuplicateRequestDto._({required this.otherDocumentId})
      : super._();
  @override
  DuplicateStackNotDuplicateRequestDto rebuild(
          void Function(DuplicateStackNotDuplicateRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DuplicateStackNotDuplicateRequestDtoBuilder toBuilder() =>
      DuplicateStackNotDuplicateRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DuplicateStackNotDuplicateRequestDto &&
        otherDocumentId == other.otherDocumentId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, otherDocumentId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DuplicateStackNotDuplicateRequestDto')
          ..add('otherDocumentId', otherDocumentId))
        .toString();
  }
}

class DuplicateStackNotDuplicateRequestDtoBuilder
    implements
        Builder<DuplicateStackNotDuplicateRequestDto,
            DuplicateStackNotDuplicateRequestDtoBuilder> {
  _$DuplicateStackNotDuplicateRequestDto? _$v;

  String? _otherDocumentId;
  String? get otherDocumentId => _$this._otherDocumentId;
  set otherDocumentId(String? otherDocumentId) =>
      _$this._otherDocumentId = otherDocumentId;

  DuplicateStackNotDuplicateRequestDtoBuilder() {
    DuplicateStackNotDuplicateRequestDto._defaults(this);
  }

  DuplicateStackNotDuplicateRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _otherDocumentId = $v.otherDocumentId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DuplicateStackNotDuplicateRequestDto other) {
    _$v = other as _$DuplicateStackNotDuplicateRequestDto;
  }

  @override
  void update(
      void Function(DuplicateStackNotDuplicateRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DuplicateStackNotDuplicateRequestDto build() => _build();

  _$DuplicateStackNotDuplicateRequestDto _build() {
    final _$result = _$v ??
        _$DuplicateStackNotDuplicateRequestDto._(
          otherDocumentId: BuiltValueNullFieldError.checkNotNull(
              otherDocumentId,
              r'DuplicateStackNotDuplicateRequestDto',
              'otherDocumentId'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
