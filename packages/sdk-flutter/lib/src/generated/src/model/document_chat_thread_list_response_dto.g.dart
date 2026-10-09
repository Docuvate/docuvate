// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_chat_thread_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentChatThreadListResponseDto
    extends DocumentChatThreadListResponseDto {
  @override
  final BuiltList<DocumentChatThreadDto> threads;

  factory _$DocumentChatThreadListResponseDto(
          [void Function(DocumentChatThreadListResponseDtoBuilder)? updates]) =>
      (DocumentChatThreadListResponseDtoBuilder()..update(updates))._build();

  _$DocumentChatThreadListResponseDto._({required this.threads}) : super._();
  @override
  DocumentChatThreadListResponseDto rebuild(
          void Function(DocumentChatThreadListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentChatThreadListResponseDtoBuilder toBuilder() =>
      DocumentChatThreadListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentChatThreadListResponseDto &&
        threads == other.threads;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, threads.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentChatThreadListResponseDto')
          ..add('threads', threads))
        .toString();
  }
}

class DocumentChatThreadListResponseDtoBuilder
    implements
        Builder<DocumentChatThreadListResponseDto,
            DocumentChatThreadListResponseDtoBuilder> {
  _$DocumentChatThreadListResponseDto? _$v;

  ListBuilder<DocumentChatThreadDto>? _threads;
  ListBuilder<DocumentChatThreadDto> get threads =>
      _$this._threads ??= ListBuilder<DocumentChatThreadDto>();
  set threads(ListBuilder<DocumentChatThreadDto>? threads) =>
      _$this._threads = threads;

  DocumentChatThreadListResponseDtoBuilder() {
    DocumentChatThreadListResponseDto._defaults(this);
  }

  DocumentChatThreadListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _threads = $v.threads.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentChatThreadListResponseDto other) {
    _$v = other as _$DocumentChatThreadListResponseDto;
  }

  @override
  void update(
      void Function(DocumentChatThreadListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentChatThreadListResponseDto build() => _build();

  _$DocumentChatThreadListResponseDto _build() {
    _$DocumentChatThreadListResponseDto _$result;
    try {
      _$result = _$v ??
          _$DocumentChatThreadListResponseDto._(
            threads: threads.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'threads';
        threads.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DocumentChatThreadListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
