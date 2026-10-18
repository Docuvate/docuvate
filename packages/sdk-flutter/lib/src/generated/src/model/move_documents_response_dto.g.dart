// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'move_documents_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$MoveDocumentsResponseDto extends MoveDocumentsResponseDto {
  @override
  final BuiltList<MoveDocumentsPreviousFolderDto> previousFolderIds;
  @override
  final num affected;

  factory _$MoveDocumentsResponseDto(
          [void Function(MoveDocumentsResponseDtoBuilder)? updates]) =>
      (new MoveDocumentsResponseDtoBuilder()..update(updates))._build();

  _$MoveDocumentsResponseDto._(
      {required this.previousFolderIds, required this.affected})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        previousFolderIds, r'MoveDocumentsResponseDto', 'previousFolderIds');
    BuiltValueNullFieldError.checkNotNull(
        affected, r'MoveDocumentsResponseDto', 'affected');
  }

  @override
  MoveDocumentsResponseDto rebuild(
          void Function(MoveDocumentsResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MoveDocumentsResponseDtoBuilder toBuilder() =>
      new MoveDocumentsResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MoveDocumentsResponseDto &&
        previousFolderIds == other.previousFolderIds &&
        affected == other.affected;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, previousFolderIds.hashCode);
    _$hash = $jc(_$hash, affected.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MoveDocumentsResponseDto')
          ..add('previousFolderIds', previousFolderIds)
          ..add('affected', affected))
        .toString();
  }
}

class MoveDocumentsResponseDtoBuilder
    implements
        Builder<MoveDocumentsResponseDto, MoveDocumentsResponseDtoBuilder> {
  _$MoveDocumentsResponseDto? _$v;

  ListBuilder<MoveDocumentsPreviousFolderDto>? _previousFolderIds;
  ListBuilder<MoveDocumentsPreviousFolderDto> get previousFolderIds =>
      _$this._previousFolderIds ??=
          new ListBuilder<MoveDocumentsPreviousFolderDto>();
  set previousFolderIds(
          ListBuilder<MoveDocumentsPreviousFolderDto>? previousFolderIds) =>
      _$this._previousFolderIds = previousFolderIds;

  num? _affected;
  num? get affected => _$this._affected;
  set affected(num? affected) => _$this._affected = affected;

  MoveDocumentsResponseDtoBuilder() {
    MoveDocumentsResponseDto._defaults(this);
  }

  MoveDocumentsResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _previousFolderIds = $v.previousFolderIds.toBuilder();
      _affected = $v.affected;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MoveDocumentsResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$MoveDocumentsResponseDto;
  }

  @override
  void update(void Function(MoveDocumentsResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MoveDocumentsResponseDto build() => _build();

  _$MoveDocumentsResponseDto _build() {
    _$MoveDocumentsResponseDto _$result;
    try {
      _$result = _$v ??
          new _$MoveDocumentsResponseDto._(
              previousFolderIds: previousFolderIds.build(),
              affected: BuiltValueNullFieldError.checkNotNull(
                  affected, r'MoveDocumentsResponseDto', 'affected'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'previousFolderIds';
        previousFolderIds.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'MoveDocumentsResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
