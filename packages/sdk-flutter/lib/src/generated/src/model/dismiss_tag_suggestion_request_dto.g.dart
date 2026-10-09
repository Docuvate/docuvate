// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dismiss_tag_suggestion_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DismissTagSuggestionRequestDto extends DismissTagSuggestionRequestDto {
  @override
  final bool? blockFuture;

  factory _$DismissTagSuggestionRequestDto(
          [void Function(DismissTagSuggestionRequestDtoBuilder)? updates]) =>
      (DismissTagSuggestionRequestDtoBuilder()..update(updates))._build();

  _$DismissTagSuggestionRequestDto._({this.blockFuture}) : super._();
  @override
  DismissTagSuggestionRequestDto rebuild(
          void Function(DismissTagSuggestionRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DismissTagSuggestionRequestDtoBuilder toBuilder() =>
      DismissTagSuggestionRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DismissTagSuggestionRequestDto &&
        blockFuture == other.blockFuture;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, blockFuture.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DismissTagSuggestionRequestDto')
          ..add('blockFuture', blockFuture))
        .toString();
  }
}

class DismissTagSuggestionRequestDtoBuilder
    implements
        Builder<DismissTagSuggestionRequestDto,
            DismissTagSuggestionRequestDtoBuilder> {
  _$DismissTagSuggestionRequestDto? _$v;

  bool? _blockFuture;
  bool? get blockFuture => _$this._blockFuture;
  set blockFuture(bool? blockFuture) => _$this._blockFuture = blockFuture;

  DismissTagSuggestionRequestDtoBuilder() {
    DismissTagSuggestionRequestDto._defaults(this);
  }

  DismissTagSuggestionRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _blockFuture = $v.blockFuture;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DismissTagSuggestionRequestDto other) {
    _$v = other as _$DismissTagSuggestionRequestDto;
  }

  @override
  void update(void Function(DismissTagSuggestionRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DismissTagSuggestionRequestDto build() => _build();

  _$DismissTagSuggestionRequestDto _build() {
    final _$result = _$v ??
        _$DismissTagSuggestionRequestDto._(
          blockFuture: blockFuture,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
