// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_document_chat_thread_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateDocumentChatThreadRequestDto
    extends UpdateDocumentChatThreadRequestDto {
  @override
  final String title;

  factory _$UpdateDocumentChatThreadRequestDto(
          [void Function(UpdateDocumentChatThreadRequestDtoBuilder)?
              updates]) =>
      (new UpdateDocumentChatThreadRequestDtoBuilder()..update(updates))
          ._build();

  _$UpdateDocumentChatThreadRequestDto._({required this.title}) : super._() {
    BuiltValueNullFieldError.checkNotNull(
        title, r'UpdateDocumentChatThreadRequestDto', 'title');
  }

  @override
  UpdateDocumentChatThreadRequestDto rebuild(
          void Function(UpdateDocumentChatThreadRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  UpdateDocumentChatThreadRequestDtoBuilder toBuilder() =>
      new UpdateDocumentChatThreadRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateDocumentChatThreadRequestDto && title == other.title;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'UpdateDocumentChatThreadRequestDto')
          ..add('title', title))
        .toString();
  }
}

class UpdateDocumentChatThreadRequestDtoBuilder
    implements
        Builder<UpdateDocumentChatThreadRequestDto,
            UpdateDocumentChatThreadRequestDtoBuilder> {
  _$UpdateDocumentChatThreadRequestDto? _$v;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  UpdateDocumentChatThreadRequestDtoBuilder() {
    UpdateDocumentChatThreadRequestDto._defaults(this);
  }

  UpdateDocumentChatThreadRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _title = $v.title;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateDocumentChatThreadRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$UpdateDocumentChatThreadRequestDto;
  }

  @override
  void update(
      void Function(UpdateDocumentChatThreadRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateDocumentChatThreadRequestDto build() => _build();

  _$UpdateDocumentChatThreadRequestDto _build() {
    final _$result = _$v ??
        new _$UpdateDocumentChatThreadRequestDto._(
            title: BuiltValueNullFieldError.checkNotNull(
                title, r'UpdateDocumentChatThreadRequestDto', 'title'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
