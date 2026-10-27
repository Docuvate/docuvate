//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:docuvate/src/generated/src/model/layout_token_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'document_layout_tokens_response_dto.g.dart';

/// DocumentLayoutTokensResponseDto
///
/// Properties:
/// * [page] 
/// * [irSha256] 
/// * [tokens] 
@BuiltValue()
abstract class DocumentLayoutTokensResponseDto implements Built<DocumentLayoutTokensResponseDto, DocumentLayoutTokensResponseDtoBuilder> {
  @BuiltValueField(wireName: r'page')
  num get page;

  @BuiltValueField(wireName: r'irSha256')
  String get irSha256;

  @BuiltValueField(wireName: r'tokens')
  BuiltList<LayoutTokenDto> get tokens;

  DocumentLayoutTokensResponseDto._();

  factory DocumentLayoutTokensResponseDto([void updates(DocumentLayoutTokensResponseDtoBuilder b)]) = _$DocumentLayoutTokensResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DocumentLayoutTokensResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DocumentLayoutTokensResponseDto> get serializer => _$DocumentLayoutTokensResponseDtoSerializer();
}

class _$DocumentLayoutTokensResponseDtoSerializer implements PrimitiveSerializer<DocumentLayoutTokensResponseDto> {
  @override
  final Iterable<Type> types = const [DocumentLayoutTokensResponseDto, _$DocumentLayoutTokensResponseDto];

  @override
  final String wireName = r'DocumentLayoutTokensResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DocumentLayoutTokensResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'page';
    yield serializers.serialize(
      object.page,
      specifiedType: const FullType(num),
    );
    yield r'irSha256';
    yield serializers.serialize(
      object.irSha256,
      specifiedType: const FullType(String),
    );
    yield r'tokens';
    yield serializers.serialize(
      object.tokens,
      specifiedType: const FullType(BuiltList, [FullType(LayoutTokenDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DocumentLayoutTokensResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DocumentLayoutTokensResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'page':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.page = valueDes;
          break;
        case r'irSha256':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.irSha256 = valueDes;
          break;
        case r'tokens':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LayoutTokenDto)]),
          ) as BuiltList<LayoutTokenDto>;
          result.tokens.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DocumentLayoutTokensResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DocumentLayoutTokensResponseDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

